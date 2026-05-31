import { describe, expect, it } from "vitest"
import {
  hasSessionCookie,
  readSessionTokenFromCookieHeader,
} from "@/lib/auth/session-cookie-edge"

describe("session-cookie-edge", () => {
  it("lee authjs.session-token", () => {
    const token = readSessionTokenFromCookieHeader(
      "authjs.session-token=abc123; other=x",
    )
    expect(token).toBe("abc123")
  })

  it("lee __Secure-authjs.session-token", () => {
    const token = readSessionTokenFromCookieHeader(
      "__Secure-authjs.session-token=secure-token",
    )
    expect(token).toBe("secure-token")
  })

  it("recompone cookies fragmentadas", () => {
    const token = readSessionTokenFromCookieHeader(
      "authjs.session-token.0=aaa; authjs.session-token.1=bbb",
    )
    expect(token).toBe("aaabbb")
  })

  it("hasSessionCookie detecta presencia", () => {
    const request = new Request("https://judiziala.co/dashboard", {
      headers: { cookie: "authjs.session-token=tok" },
    })
    expect(hasSessionCookie(request)).toBe(true)
  })

  it("hasSessionCookie false sin cookie", () => {
    const request = new Request("https://judiziala.co/dashboard")
    expect(hasSessionCookie(request)).toBe(false)
  })
})
