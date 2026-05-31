import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const { findUnique } = vi.hoisted(() => ({
  findUnique: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    session: {
      findUnique,
    },
  },
}))

import {
  getSessionExpiryForToken,
  shouldInvalidateSession,
} from "@/lib/auth/session-callback"

describe("getSessionExpiryForToken", () => {
  beforeEach(() => {
    findUnique.mockReset()
  })

  it("devuelve missing sin sessionToken", async () => {
    expect(await getSessionExpiryForToken(null)).toBe("missing")
    expect(await getSessionExpiryForToken(undefined)).toBe("missing")
    expect(findUnique).not.toHaveBeenCalled()
  })

  it("consulta DB y devuelve ok para sesion vigente", async () => {
    const now = Date.now()
    findUnique.mockResolvedValue({
      revokedAt: null,
      expires: new Date(now + 60 * 60 * 1000),
      lastSeenAt: new Date(now - 60 * 1000),
    })

    expect(await getSessionExpiryForToken("token-abc")).toBe("ok")
    expect(findUnique).toHaveBeenCalledWith({
      where: { sessionToken: "token-abc" },
      select: { revokedAt: true, expires: true, lastSeenAt: true },
    })
  })

  it("devuelve revoked cuando la fila esta revocada", async () => {
    findUnique.mockResolvedValue({
      revokedAt: new Date(),
      expires: new Date(Date.now() + 60 * 60 * 1000),
      lastSeenAt: new Date(),
    })

    expect(await getSessionExpiryForToken("token-revoked")).toBe("revoked")
  })
})

describe("shouldInvalidateSession", () => {
  it("invalida solo revoked, idle y absolute", () => {
    expect(shouldInvalidateSession("ok")).toBe(false)
    expect(shouldInvalidateSession("missing")).toBe(false)
    expect(shouldInvalidateSession("revoked")).toBe(true)
    expect(shouldInvalidateSession("idle")).toBe(true)
    expect(shouldInvalidateSession("absolute")).toBe(true)
  })
})
