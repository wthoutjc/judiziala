import { afterEach, describe, expect, it } from "vitest"
import {
  buildAuthCookies,
  shouldUseSecureCookies,
} from "@/lib/auth/secure-cookies"

const envSnapshot = { ...process.env }

afterEach(() => {
  process.env = { ...envSnapshot }
})

describe("shouldUseSecureCookies", () => {
  it("devuelve true cuando AUTH_URL es https", () => {
    process.env.AUTH_URL = "https://judiziala.co"
    process.env.NODE_ENV = "development"
    expect(shouldUseSecureCookies()).toBe(true)
  })

  it("devuelve false en development sin AUTH_URL https", () => {
    delete process.env.AUTH_URL
    process.env.NODE_ENV = "development"
    expect(shouldUseSecureCookies()).toBe(false)
  })

  it("devuelve true en production sin AUTH_URL", () => {
    delete process.env.AUTH_URL
    process.env.NODE_ENV = "production"
    expect(shouldUseSecureCookies()).toBe(true)
  })
})

describe("buildAuthCookies", () => {
  it("aplica httpOnly, sameSite lax y secure en prod", () => {
    const cookies = buildAuthCookies(true)

    for (const key of [
      "sessionToken",
      "callbackUrl",
      "csrfToken",
      "pkceCodeVerifier",
      "state",
    ] as const) {
      expect(cookies[key].options.httpOnly).toBe(true)
      expect(cookies[key].options.sameSite).toBe("lax")
      expect(cookies[key].options.secure).toBe(true)
      expect(cookies[key].options.path).toBe("/")
    }
  })

  it("permite secure false en localhost", () => {
    const cookies = buildAuthCookies(false)
    expect(cookies.sessionToken.options.secure).toBe(false)
    expect(cookies.sessionToken.options.httpOnly).toBe(true)
    expect(cookies.sessionToken.options.sameSite).toBe("lax")
  })
})
