import { afterEach, describe, expect, it, vi } from "vitest"
import {
  isCpnuMetricsEnabled,
  logCpnuMetric,
} from "../cpnu-telemetry"

describe("cpnu-telemetry", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("emite JSON cuando CPNU_METRICS_ENABLED=true", () => {
    vi.stubEnv("CPNU_METRICS_ENABLED", "true")
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    logCpnuMetric({
      metric: "cpnu.request",
      outcome: "success",
      endpoint: "/api/v2/Proceso/Detalle/1",
      durationMs: 42,
    })

    expect(spy).toHaveBeenCalledOnce()
    const payload = JSON.parse(String(spy.mock.calls[0][0]))
    expect(payload.metric).toBe("cpnu.request")
    expect(payload.outcome).toBe("success")
    expect(payload.durationMs).toBe(42)
  })

  it("no emite cuando CPNU_METRICS_ENABLED=false", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("CPNU_METRICS_ENABLED", "false")
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    logCpnuMetric({
      metric: "cpnu.request",
      outcome: "error",
      endpoint: "/test",
      durationMs: 1,
      code: "TIMEOUT",
    })

    expect(spy).not.toHaveBeenCalled()
    expect(isCpnuMetricsEnabled()).toBe(false)
  })
})
