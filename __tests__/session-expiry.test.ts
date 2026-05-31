import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("@/lib/demo-mode", () => ({ isDemoAuthEnabled: () => false }))

import {
  getSessionExpiryReason,
  SESSION_IDLE_TIMEOUT_MS,
} from "@/lib/auth/session-expiry"

const now = new Date("2026-05-31T12:00:00.000Z").getTime()

function session(overrides: {
  revokedAt?: Date | null
  expires?: Date
  lastSeenAt?: Date
}) {
  return {
    revokedAt: null,
    expires: new Date(now + 60 * 60 * 1000),
    lastSeenAt: new Date(now - 5 * 60 * 1000),
    ...overrides,
  }
}

describe("getSessionExpiryReason", () => {
  it("devuelve ok para sesion vigente", () => {
    expect(getSessionExpiryReason(session({}), now)).toBe("ok")
  })

  it("devuelve idle cuando lastSeenAt supera 30 minutos", () => {
    expect(
      getSessionExpiryReason(
        session({
          lastSeenAt: new Date(now - SESSION_IDLE_TIMEOUT_MS - 1_000),
        }),
        now,
      ),
    ).toBe("idle")
  })

  it("devuelve absolute cuando expires esta en el pasado", () => {
    expect(
      getSessionExpiryReason(
        session({
          expires: new Date(now - 1_000),
        }),
        now,
      ),
    ).toBe("absolute")
  })

  it("prioriza revoked sobre idle y absolute", () => {
    expect(
      getSessionExpiryReason(
        session({
          revokedAt: new Date(now - 60 * 60 * 1000),
          expires: new Date(now - 1_000),
          lastSeenAt: new Date(now - SESSION_IDLE_TIMEOUT_MS - 1_000),
        }),
        now,
      ),
    ).toBe("revoked")
  })

  it("devuelve missing cuando no hay sesion", () => {
    expect(getSessionExpiryReason(null, now)).toBe("missing")
  })
})
