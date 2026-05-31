import "server-only"

import { createHmac } from "node:crypto"

const MAX_USER_AGENT_LENGTH = 512

export type SessionMetadata = {
  userAgent: string | null
  ipHash: string | null
  device: string | null
}

export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }

  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip")
}

export function hashIp(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(ip).digest("hex")
}

export function parseDevice(userAgent: string): string {
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)
          ? "Safari"
          : "Browser"

  const os = /Windows/.test(userAgent)
    ? "Windows"
    : /Mac OS X/.test(userAgent)
      ? "macOS"
      : /Android/.test(userAgent)
        ? "Android"
        : /iPhone|iPad/.test(userAgent)
          ? "iOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "Unknown"

  return `${browser} / ${os}`
}

export function extractSessionMetadata(
  headers: Headers,
  secret: string,
): SessionMetadata {
  const rawUserAgent = headers.get("user-agent")?.trim() ?? null
  const userAgent =
    rawUserAgent && rawUserAgent.length > MAX_USER_AGENT_LENGTH
      ? rawUserAgent.slice(0, MAX_USER_AGENT_LENGTH)
      : rawUserAgent

  const ip = getClientIp(headers)
  const ipHash = ip ? hashIp(ip, secret) : null
  const device = userAgent ? parseDevice(userAgent) : null

  return { userAgent, ipHash, device }
}
