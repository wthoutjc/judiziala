import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const { findUnique, update, isDemoAuthEnabled, auditIpChange } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  isDemoAuthEnabled: vi.fn(() => false),
  auditIpChange: vi.fn(async () => undefined),
}))

vi.mock("@/lib/demo-mode", () => ({
  isDemoAuthEnabled,
}))

vi.mock("@/lib/auth/audit", () => ({
  auditIpChange,
}))

vi.mock("@/lib/env", () => ({
  env: { AUTH_SECRET: "test-secret-for-audit" },
}))

vi.mock("@/lib/db", () => ({
  db: {
    session: {
      findUnique,
      update,
    },
  },
}))

import { hashIp } from "@/lib/auth/session-metadata"
import { POST } from "@/app/api/heartbeat/route"
import {
  runHeartbeat,
  toHeartbeatResponse,
} from "@/lib/auth/heartbeat"
import { SESSION_IDLE_TIMEOUT_MS } from "@/lib/auth/session-expiry"

const now = Date.now()

function mockRequest(cookie?: string, ip = "203.0.113.10") {
  return new Request("http://localhost/api/heartbeat", {
    method: "POST",
    headers: {
      ...(cookie ? { cookie } : {}),
      "x-forwarded-for": ip,
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0",
    },
  })
}

function activeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    userId: "user-1",
    revokedAt: null,
    expires: new Date(now + 60 * 60 * 1000),
    lastSeenAt: new Date(now - 60 * 1000),
    ipHash: hashIp("203.0.113.10", "test-secret-for-audit"),
    device: "Chrome / macOS",
    ...overrides,
  }
}

describe("runHeartbeat", () => {
  beforeEach(() => {
    findUnique.mockReset()
    update.mockReset()
    auditIpChange.mockReset()
    isDemoAuthEnabled.mockReturnValue(false)
    update.mockResolvedValue({})
  })

  it("devuelve unauthorized sin cookie", async () => {
    expect(await runHeartbeat(mockRequest())).toBe("unauthorized")
  })

  it("devuelve ok y actualiza lastSeenAt para sesion activa", async () => {
    findUnique.mockResolvedValue(activeSession())

    const status = await runHeartbeat(
      mockRequest("authjs.session-token=token-active"),
    )

    expect(status).toBe("ok")
    expect(update).toHaveBeenCalledWith({
      where: { sessionToken: "token-active" },
      data: {
        lastSeenAt: expect.any(Date),
        ipHash: hashIp("203.0.113.10", "test-secret-for-audit"),
        device: "Chrome / macOS",
      },
    })
    expect(auditIpChange).not.toHaveBeenCalled()
  })

  it("audita y actualiza ipHash cuando cambia la IP", async () => {
    findUnique.mockResolvedValue(
      activeSession({
        ipHash: hashIp("198.51.100.1", "test-secret-for-audit"),
      }),
    )

    const status = await runHeartbeat(
      mockRequest("authjs.session-token=token-active", "203.0.113.10"),
    )

    expect(status).toBe("ok")
    expect(auditIpChange).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        sessionId: "session-1",
        reason: "heartbeat_ip_change",
      }),
    )
  })

  it("devuelve revoked cuando revokedAt esta seteado", async () => {
    findUnique.mockResolvedValue(
      activeSession({ revokedAt: new Date(now - 1_000) }),
    )

    expect(
      await runHeartbeat(mockRequest("authjs.session-token=token-revoked")),
    ).toBe("revoked")
    expect(update).not.toHaveBeenCalled()
  })

  it("devuelve idle cuando lastSeenAt esta vencido", async () => {
    findUnique.mockResolvedValue(
      activeSession({
        lastSeenAt: new Date(now - SESSION_IDLE_TIMEOUT_MS - 1_000),
      }),
    )

    expect(
      await runHeartbeat(mockRequest("authjs.session-token=token-idle")),
    ).toBe("idle")
    expect(update).not.toHaveBeenCalled()
  })

  it("devuelve expired cuando expires esta en el pasado", async () => {
    findUnique.mockResolvedValue(
      activeSession({ expires: new Date(now - 1_000) }),
    )

    expect(
      await runHeartbeat(mockRequest("authjs.session-token=token-expired")),
    ).toBe("expired")
    expect(update).not.toHaveBeenCalled()
  })

  it("en demo mode devuelve ok sin consultar la base de datos", async () => {
    isDemoAuthEnabled.mockReturnValue(true)

    expect(await runHeartbeat(mockRequest())).toBe("ok")
    expect(findUnique).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })
})

describe("toHeartbeatResponse", () => {
  it("mapea ok a 204 sin body", () => {
    const response = toHeartbeatResponse("ok")
    expect(response.status).toBe(204)
  })

  it("mapea revoked a 401 session_revoked", async () => {
    const response = toHeartbeatResponse("revoked")
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "session_revoked" })
  })

  it("mapea unauthorized a 401", async () => {
    const response = toHeartbeatResponse("unauthorized")
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "unauthorized" })
  })

  it("mapea idle y expired a 401 con codigos de error", async () => {
    const idle = toHeartbeatResponse("idle")
    expect(idle.status).toBe(401)
    expect(await idle.json()).toEqual({ error: "session_idle" })

    const expired = toHeartbeatResponse("expired")
    expect(expired.status).toBe(401)
    expect(await expired.json()).toEqual({ error: "session_expired" })
  })
})

describe("flujo revoke -> heartbeat", () => {
  beforeEach(() => {
    findUnique.mockReset()
    update.mockReset()
    isDemoAuthEnabled.mockReturnValue(false)
  })

  it("tras revoke devuelve 401 session_revoked end-to-end", async () => {
    findUnique.mockResolvedValue(
      activeSession({ revokedAt: new Date(now - 1_000) }),
    )

    const status = await runHeartbeat(
      mockRequest("authjs.session-token=token-a"),
    )
    const response = toHeartbeatResponse(status)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "session_revoked" })
    expect(update).not.toHaveBeenCalled()
  })
})

describe("POST /api/heartbeat", () => {
  beforeEach(() => {
    findUnique.mockReset()
    update.mockReset()
    auditIpChange.mockReset()
    isDemoAuthEnabled.mockReturnValue(false)
    update.mockResolvedValue({})
  })

  it("devuelve 204 para sesion activa", async () => {
    findUnique.mockResolvedValue(activeSession())

    const response = await POST(
      mockRequest("authjs.session-token=token-active"),
    )

    expect(response.status).toBe(204)
  })
})
