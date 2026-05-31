import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/demo-mode", () => ({
  isDemoAuthEnabled: () => false,
}))

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
  getCurrentSession,
  toCurrentSessionResponse,
} from "@/lib/auth/current-session"
import { SESSION_IDLE_TIMEOUT_MS } from "@/lib/auth/session-expiry"

const now = Date.now()

function mockRequest(cookie?: string) {
  return new Request("http://localhost/api/session", {
    method: "GET",
    headers: cookie ? { cookie } : {},
  })
}

describe("getCurrentSession", () => {
  beforeEach(() => {
    findUnique.mockReset()
  })

  it("devuelve unauthorized sin cookie", async () => {
    expect(await getCurrentSession(mockRequest())).toEqual({
      status: "unauthorized",
    })
  })

  it("devuelve device, ipHash y lastSeenAt para sesion activa", async () => {
    const lastSeenAt = new Date(now - 60 * 1000)
    const expires = new Date(now + 60 * 60 * 1000)

    findUnique.mockResolvedValue({
      device: "Chrome / Windows",
      ipHash: "abc123",
      lastSeenAt,
      expires,
      revokedAt: null,
    })

    const result = await getCurrentSession(
      mockRequest("authjs.session-token=token-active"),
    )

    expect(result).toEqual({
      status: "ok",
      session: {
        device: "Chrome / Windows",
        ipHash: "abc123",
        lastSeenAt: lastSeenAt.toISOString(),
        expires: expires.toISOString(),
      },
    })
  })

  it("devuelve revoked cuando la sesion fue revocada", async () => {
    findUnique.mockResolvedValue({
      device: "Chrome / Windows",
      ipHash: "abc123",
      lastSeenAt: new Date(now - 60 * 1000),
      expires: new Date(now + 60 * 60 * 1000),
      revokedAt: new Date(now - 1_000),
    })

    expect(
      await getCurrentSession(mockRequest("authjs.session-token=token-revoked")),
    ).toEqual({ status: "revoked" })
  })

  it("devuelve idle cuando lastSeenAt supera 30 minutos", async () => {
    findUnique.mockResolvedValue({
      device: "Chrome / Windows",
      ipHash: "abc123",
      lastSeenAt: new Date(now - SESSION_IDLE_TIMEOUT_MS - 1_000),
      expires: new Date(now + 60 * 60 * 1000),
      revokedAt: null,
    })

    expect(
      await getCurrentSession(mockRequest("authjs.session-token=token-idle")),
    ).toEqual({ status: "idle" })
  })
})

describe("toCurrentSessionResponse", () => {
  it("serializa la sesion activa como JSON 200", async () => {
    const response = toCurrentSessionResponse({
      status: "ok",
      session: {
        device: "Chrome / Windows",
        ipHash: "abc123",
        lastSeenAt: "2026-05-31T12:00:00.000Z",
        expires: "2026-05-31T18:00:00.000Z",
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      device: "Chrome / Windows",
      ipHash: "abc123",
      lastSeenAt: "2026-05-31T12:00:00.000Z",
      expires: "2026-05-31T18:00:00.000Z",
    })
  })
})
