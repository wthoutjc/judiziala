import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  isAuthMetricsEnabled,
  logAuthMetric,
  logHeartbeatMetric,
  logOAuthDeny,
  logOAuthError,
  logOAuthSuccess,
  logRateLimitMetric,
} from "@/lib/auth/auth-metrics"

const envSnapshot = { ...process.env }
const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined)

afterEach(() => {
  process.env = { ...envSnapshot }
  logSpy.mockClear()
})

describe("isAuthMetricsEnabled", () => {
  it("activo en production por defecto", () => {
    process.env.NODE_ENV = "production"
    delete process.env.AUTH_METRICS_ENABLED
    expect(isAuthMetricsEnabled()).toBe(true)
  })

  it("inactivo en development por defecto", () => {
    process.env.NODE_ENV = "development"
    delete process.env.AUTH_METRICS_ENABLED
    expect(isAuthMetricsEnabled()).toBe(false)
  })

  it("respeta AUTH_METRICS_ENABLED=true en dev", () => {
    process.env.NODE_ENV = "development"
    process.env.AUTH_METRICS_ENABLED = "true"
    expect(isAuthMetricsEnabled()).toBe(true)
  })
})

describe("logAuthMetric", () => {
  it("emite JSON estructurado en production", () => {
    process.env.NODE_ENV = "production"
    delete process.env.AUTH_METRICS_ENABLED

    logAuthMetric({ metric: "auth.test", outcome: "ok" })

    expect(logSpy).toHaveBeenCalledOnce()
    const payload = JSON.parse(String(logSpy.mock.calls[0][0]))
    expect(payload.metric).toBe("auth.test")
    expect(payload.outcome).toBe("ok")
    expect(payload.ts).toBeTruthy()
  })

  it("no emite en development sin flag", () => {
    process.env.NODE_ENV = "development"
    delete process.env.AUTH_METRICS_ENABLED

    logAuthMetric({ metric: "auth.test" })

    expect(logSpy).not.toHaveBeenCalled()
  })
})

describe("helpers de metricas auth", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production"
    delete process.env.AUTH_METRICS_ENABLED
  })

  it("logOAuthSuccess", () => {
    logOAuthSuccess("google")
    const payload = JSON.parse(String(logSpy.mock.calls[0][0]))
    expect(payload).toMatchObject({
      metric: "auth.oauth",
      outcome: "success",
      provider: "google",
    })
  })

  it("logOAuthDeny", () => {
    logOAuthDeny("allowlist")
    const payload = JSON.parse(String(logSpy.mock.calls[0][0]))
    expect(payload.outcome).toBe("deny")
    expect(payload.reason).toBe("allowlist")
  })

  it("logOAuthError trunca detail", () => {
    logOAuthError("OAuthCallback", "x".repeat(300))
    const payload = JSON.parse(String(logSpy.mock.calls[0][0]))
    expect(payload.code).toBe("OAuthCallback")
    expect(payload.detail).toHaveLength(200)
  })

  it("logHeartbeatMetric", () => {
    logHeartbeatMetric("ok", 42, 204)
    const payload = JSON.parse(String(logSpy.mock.calls[0][0]))
    expect(payload).toMatchObject({
      metric: "auth.heartbeat",
      status: "ok",
      durationMs: 42,
      httpStatus: 204,
    })
  })

  it("logRateLimitMetric", () => {
    logRateLimitMetric("heartbeat", 60)
    const payload = JSON.parse(String(logSpy.mock.calls[0][0]))
    expect(payload).toMatchObject({
      metric: "auth.rate_limit",
      bucket: "heartbeat",
      retryAfterSec: 60,
      httpStatus: 429,
    })
  })
})
