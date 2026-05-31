import { afterEach, describe, expect, it } from "vitest"
import { CpnuError } from "../cpnu-error"
import {
  assertCpnuUserRateLimit,
  CPNU_USER_RL_MAX_DEFAULT,
  resetCpnuUserRateLimitStoreForTests,
} from "../cpnu-user-rate-limit"

describe("cpnu-user-rate-limit", () => {
  afterEach(() => {
    resetCpnuUserRateLimitStoreForTests()
  })

  it("permite consultas hasta el maximo por ventana", () => {
    const userId = "user-a"

    for (let i = 0; i < CPNU_USER_RL_MAX_DEFAULT; i += 1) {
      expect(() => assertCpnuUserRateLimit(userId)).not.toThrow()
    }
  })

  it("rechaza cuando se excede la cuota del usuario", () => {
    const userId = "user-b"

    for (let i = 0; i < CPNU_USER_RL_MAX_DEFAULT; i += 1) {
      assertCpnuUserRateLimit(userId)
    }

    expect(() => assertCpnuUserRateLimit(userId)).toThrow(CpnuError)
    try {
      assertCpnuUserRateLimit(userId)
    } catch (error) {
      expect(error).toMatchObject({ code: "USER_RATE_LIMITED" })
    }
  })

  it("reinicia la ventana cuando expira el tiempo", () => {
    let now = 1_000
    resetCpnuUserRateLimitStoreForTests(() => now)

    for (let i = 0; i < CPNU_USER_RL_MAX_DEFAULT; i += 1) {
      assertCpnuUserRateLimit("user-c")
    }

    now += 600_001
    expect(() => assertCpnuUserRateLimit("user-c")).not.toThrow()
  })
})
