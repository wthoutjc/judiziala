import { describe, expect, it } from "vitest"
import {
  CpnuCircuitBreaker,
  isInfrastructureFailure,
} from "../cpnu-circuit-breaker"
import { createCpnuClient } from "../cpnu-client.impl"
import { CpnuError } from "../cpnu-error"
import { CpnuRateLimiter } from "../cpnu-rate-limit"

describe("CpnuRateLimiter", () => {
  it("permite burst inicial y rechaza cuando excede maxWaitMs", async () => {
    let now = 0
    const limiter = new CpnuRateLimiter({
      maxRps: 1,
      burst: 3,
      maxWaitMs: 100,
      now: () => now,
      sleep: async (ms) => {
        now += ms
      },
    })

    await limiter.acquire()
    await limiter.acquire()
    await limiter.acquire()

    await expect(limiter.acquire()).rejects.toMatchObject({
      code: "RATE_LIMITED",
    })
  })
})

describe("CpnuCircuitBreaker", () => {
  it("abre tras fallos consecutivos de infraestructura", () => {
    const breaker = new CpnuCircuitBreaker({ failureThreshold: 5 })

    for (let i = 0; i < 5; i++) {
      breaker.recordFailure(new CpnuError("network", "NETWORK"))
    }

    expect(breaker.getState()).toBe("open")
    expect(() => breaker.assertClosed()).toThrowError(
      expect.objectContaining({ code: "CIRCUIT_OPEN" })
    )
  })

  it("no cuenta HTTP 400 como fallo de infraestructura", () => {
    const breaker = new CpnuCircuitBreaker({ failureThreshold: 1 })

    breaker.recordFailure(
      new CpnuError("bad request", "HTTP", { status: 400 })
    )

    expect(breaker.getState()).toBe("closed")
    expect(isInfrastructureFailure(
      new CpnuError("bad request", "HTTP", { status: 400 })
    )).toBe(false)
  })

  it("pasa a half_open tras cooldown y se cierra con exito", () => {
    let now = 0
    const breaker = new CpnuCircuitBreaker({
      failureThreshold: 1,
      cooldownMs: 1_000,
      now: () => now,
    })

    breaker.recordFailure(new CpnuError("network", "NETWORK"))
    expect(breaker.getState()).toBe("open")

    now = 1_000
    expect(breaker.getState()).toBe("half_open")
    expect(() => breaker.assertClosed()).not.toThrow()

    breaker.recordSuccess()
    expect(breaker.getState()).toBe("closed")
  })
})

describe("CpnuClient resilience", () => {
  it("fail-fast sin HTTP cuando el circuit esta abierto", async () => {
    const breaker = new CpnuCircuitBreaker({ failureThreshold: 1 })
    breaker.recordFailure(new CpnuError("network", "NETWORK"))

    let fetchCalled = false
    const client = createCpnuClient({
      circuitBreaker: breaker,
      fetchImpl: async () => {
        fetchCalled = true
        return new Response("{}")
      },
    })

    await expect(
      client.porRadicado("05001600020620201819700")
    ).rejects.toMatchObject({ code: "CIRCUIT_OPEN" })

    expect(fetchCalled).toBe(false)
  })
})
