import { NextRequest } from "next/server"
import { afterEach, describe, expect, it } from "vitest"
import {
  AUTH_RL_AUTH_MAX_DEFAULT,
  AUTH_RL_AUTH_WINDOW_MS_DEFAULT,
  AUTH_RL_HEARTBEAT_MAX_DEFAULT,
  AUTH_RL_HEARTBEAT_WINDOW_MS_DEFAULT,
  checkRateLimit,
  getClientIp,
  isRateLimitedRoute,
  resetEdgeRateLimitStoreForTests,
  setEdgeRateLimitClockForTests,
} from "@/lib/auth/edge-rate-limit"

function makeRequest(
  pathname: string,
  options: { method?: string; ip?: string } = {},
): NextRequest {
  const headers = new Headers()
  if (options.ip) {
    headers.set("x-forwarded-for", options.ip)
  }

  return new NextRequest(`http://localhost${pathname}`, {
    method: options.method ?? "GET",
    headers,
  })
}

afterEach(() => {
  resetEdgeRateLimitStoreForTests()
})

describe("isRateLimitedRoute", () => {
  it("limita POST /api/heartbeat", () => {
    expect(isRateLimitedRoute("/api/heartbeat", "POST")).toBe(true)
  })

  it("no limita GET /api/heartbeat", () => {
    expect(isRateLimitedRoute("/api/heartbeat", "GET")).toBe(false)
  })

  it("limita rutas auth sensibles", () => {
    expect(isRateLimitedRoute("/api/auth/signin/google", "GET")).toBe(true)
    expect(isRateLimitedRoute("/api/auth/callback/google", "GET")).toBe(true)
    expect(isRateLimitedRoute("/api/auth/csrf", "GET")).toBe(true)
  })

  it("no limita session de NextAuth", () => {
    expect(isRateLimitedRoute("/api/auth/session", "GET")).toBe(false)
  })
})

describe("getClientIp", () => {
  it("usa el primer valor de x-forwarded-for", () => {
    const request = makeRequest("/api/heartbeat", {
      method: "POST",
      ip: "203.0.113.1, 10.0.0.1",
    })
    expect(getClientIp(request)).toBe("203.0.113.1")
  })

  it("usa unknown sin headers de IP", () => {
    expect(getClientIp(makeRequest("/api/heartbeat", { method: "POST" }))).toBe(
      "unknown",
    )
  })
})

describe("checkRateLimit", () => {
  it("aisla contadores por IP", () => {
    let now = 1_700_000_000_000
    setEdgeRateLimitClockForTests(() => now)

    for (let i = 0; i < AUTH_RL_HEARTBEAT_MAX_DEFAULT; i += 1) {
      expect(checkRateLimit(makeRequest("/api/heartbeat", { method: "POST", ip: "1.1.1.1" }))).toBeNull()
    }

    expect(
      checkRateLimit(makeRequest("/api/heartbeat", { method: "POST", ip: "1.1.1.1" })),
    ).not.toBeNull()

    expect(
      checkRateLimit(makeRequest("/api/heartbeat", { method: "POST", ip: "2.2.2.2" })),
    ).toBeNull()
  })

  it("bloquea heartbeat tras superar el maximo", async () => {
    for (let i = 0; i < AUTH_RL_HEARTBEAT_MAX_DEFAULT; i += 1) {
      expect(
        checkRateLimit(makeRequest("/api/heartbeat", { method: "POST", ip: "9.9.9.9" })),
      ).toBeNull()
    }

    const blocked = checkRateLimit(
      makeRequest("/api/heartbeat", { method: "POST", ip: "9.9.9.9" }),
    )
    expect(blocked?.status).toBe(429)
    expect(await blocked?.json()).toEqual({ error: "rate_limited" })
    expect(blocked?.headers.get("Retry-After")).toBeTruthy()
  })

  it("bloquea auth signin tras superar el maximo", async () => {
    for (let i = 0; i < AUTH_RL_AUTH_MAX_DEFAULT; i += 1) {
      expect(
        checkRateLimit(makeRequest("/api/auth/signin/google", { ip: "8.8.8.8" })),
      ).toBeNull()
    }

    const blocked = checkRateLimit(makeRequest("/api/auth/signin/google", { ip: "8.8.8.8" }))
    expect(blocked?.status).toBe(429)
    expect(await blocked?.json()).toEqual({ error: "rate_limited" })
  })

  it("permite de nuevo tras expirar la ventana", () => {
    let now = 1_700_000_000_000
    setEdgeRateLimitClockForTests(() => now)

    for (let i = 0; i < AUTH_RL_HEARTBEAT_MAX_DEFAULT; i += 1) {
      expect(
        checkRateLimit(makeRequest("/api/heartbeat", { method: "POST", ip: "7.7.7.7" })),
      ).toBeNull()
    }

    expect(
      checkRateLimit(makeRequest("/api/heartbeat", { method: "POST", ip: "7.7.7.7" })),
    ).not.toBeNull()

    now += AUTH_RL_HEARTBEAT_WINDOW_MS_DEFAULT + 1

    expect(
      checkRateLimit(makeRequest("/api/heartbeat", { method: "POST", ip: "7.7.7.7" })),
    ).toBeNull()
  })

  it("no limita GET /api/heartbeat via checkRateLimit", () => {
    for (let i = 0; i < 10; i += 1) {
      expect(
        checkRateLimit(makeRequest("/api/heartbeat", { method: "GET", ip: "6.6.6.6" })),
      ).toBeNull()
    }
  })
})

describe("auth window defaults", () => {
  it("expone ventanas documentadas", () => {
    expect(AUTH_RL_HEARTBEAT_WINDOW_MS_DEFAULT).toBe(60_000)
    expect(AUTH_RL_AUTH_WINDOW_MS_DEFAULT).toBe(600_000)
  })
})
