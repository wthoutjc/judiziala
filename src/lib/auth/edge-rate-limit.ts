import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logRateLimitMetric } from "@/lib/auth/auth-metrics"

export const AUTH_RL_HEARTBEAT_MAX_DEFAULT = 4
export const AUTH_RL_HEARTBEAT_WINDOW_MS_DEFAULT = 60_000
export const AUTH_RL_AUTH_MAX_DEFAULT = 20
export const AUTH_RL_AUTH_WINDOW_MS_DEFAULT = 600_000

const AUTH_RATE_LIMITED_PREFIXES = [
  "/api/auth/signin",
  "/api/auth/callback",
  "/api/auth/csrf",
  "/api/auth/providers",
  "/api/auth/error",
] as const

const CLEANUP_EVERY_N_CHECKS = 64

type RateLimitBucket = "heartbeat" | "auth"

type WindowEntry = {
  count: number
  windowStart: number
}

const store = new Map<string, WindowEntry>()
let checksSinceCleanup = 0
let nowFn: () => number = Date.now

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback

  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function bucketConfig(bucket: RateLimitBucket): { max: number; windowMs: number } {
  if (bucket === "heartbeat") {
    return {
      max: parseEnvInt("AUTH_RL_HEARTBEAT_MAX", AUTH_RL_HEARTBEAT_MAX_DEFAULT),
      windowMs: parseEnvInt(
        "AUTH_RL_HEARTBEAT_WINDOW_MS",
        AUTH_RL_HEARTBEAT_WINDOW_MS_DEFAULT,
      ),
    }
  }

  return {
    max: parseEnvInt("AUTH_RL_AUTH_MAX", AUTH_RL_AUTH_MAX_DEFAULT),
    windowMs: parseEnvInt("AUTH_RL_AUTH_WINDOW_MS", AUTH_RL_AUTH_WINDOW_MS_DEFAULT),
  }
}

function maybeCleanupStore(now: number): void {
  checksSinceCleanup += 1
  if (checksSinceCleanup < CLEANUP_EVERY_N_CHECKS) return

  checksSinceCleanup = 0
  const maxWindowMs = Math.max(
    AUTH_RL_HEARTBEAT_WINDOW_MS_DEFAULT,
    AUTH_RL_AUTH_WINDOW_MS_DEFAULT,
  )

  for (const [key, entry] of store) {
    if (now - entry.windowStart >= maxWindowMs) {
      store.delete(key)
    }
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  return "unknown"
}

export function isRateLimitedRoute(pathname: string, method: string): boolean {
  if (pathname === "/api/heartbeat") {
    return method.toUpperCase() === "POST"
  }

  return AUTH_RATE_LIMITED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function resolveBucket(pathname: string, method: string): RateLimitBucket | null {
  if (pathname === "/api/heartbeat") {
    return method.toUpperCase() === "POST" ? "heartbeat" : null
  }
  if (AUTH_RATE_LIMITED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return "auth"
  }
  return null
}

function isLimited(key: string, max: number, windowMs: number, now: number): number | null {
  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return null
  }

  if (entry.count >= max) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((entry.windowStart + windowMs - now) / 1000),
    )
    return retryAfterSec
  }

  entry.count += 1
  return null
}

export function checkRateLimit(request: NextRequest): NextResponse | null {
  const bucket = resolveBucket(request.nextUrl.pathname, request.method)
  if (!bucket) return null

  const now = nowFn()
  maybeCleanupStore(now)

  const { max, windowMs } = bucketConfig(bucket)
  const key = `${bucket}:${getClientIp(request)}`
  const retryAfterSec = isLimited(key, max, windowMs, now)

  if (retryAfterSec === null) return null

  logRateLimitMetric(bucket, retryAfterSec)

  return NextResponse.json(
    { error: "rate_limited" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    },
  )
}

export function resetEdgeRateLimitStoreForTests(): void {
  store.clear()
  checksSinceCleanup = 0
  nowFn = Date.now
}

export function setEdgeRateLimitClockForTests(now: () => number): void {
  nowFn = now
}
