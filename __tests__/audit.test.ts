import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const { allowlistCount, allowlistFindFirst, accessAuditCreate } = vi.hoisted(
  () => ({
    allowlistCount: vi.fn(),
    allowlistFindFirst: vi.fn(),
    accessAuditCreate: vi.fn(),
  }),
)

vi.mock("@/lib/db", () => ({
  db: {
    allowlist: {
      count: allowlistCount,
      findFirst: allowlistFindFirst,
    },
    accessAuditLog: {
      create: accessAuditCreate,
    },
  },
}))

import { AccessAuditEvent } from "@/lib/auth/audit"
import {
  auditDeny,
  auditIpChange,
  auditLogin,
  auditRevoke,
  isAllowlistedEmail,
} from "@/lib/auth/audit"

describe("isAllowlistedEmail", () => {
  beforeEach(() => {
    allowlistCount.mockReset()
    allowlistFindFirst.mockReset()
  })

  it("permite cualquier email cuando la allowlist esta vacia", async () => {
    allowlistCount.mockResolvedValue(0)

    expect(await isAllowlistedEmail("user@example.com")).toBe(true)
    expect(allowlistFindFirst).not.toHaveBeenCalled()
  })

  it("deniega email fuera de allowlist", async () => {
    allowlistCount.mockResolvedValue(1)
    allowlistFindFirst.mockResolvedValue(null)

    expect(await isAllowlistedEmail("blocked@example.com")).toBe(false)
  })

  it("permite email en allowlist por dominio", async () => {
    allowlistCount.mockResolvedValue(1)
    allowlistFindFirst.mockResolvedValue({ id: "allow-1" })

    expect(await isAllowlistedEmail("User@Firma.com")).toBe(true)
    expect(allowlistFindFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ email: "user@firma.com" }, { domain: "firma.com" }],
      },
      select: { id: true },
    })
  })
})

describe("audit writers", () => {
  beforeEach(() => {
    accessAuditCreate.mockReset()
    accessAuditCreate.mockResolvedValue({})
  })

  it("auditLogin persiste evento LOGIN", async () => {
    await auditLogin({
      userId: "user-1",
      email: "user@firma.com",
      sessionId: "session-1",
      ipHash: "hash-a",
      device: "Chrome / macOS",
    })

    expect(accessAuditCreate).toHaveBeenCalledWith({
      data: {
        event: AccessAuditEvent.LOGIN,
        userId: "user-1",
        email: "user@firma.com",
        sessionId: "session-1",
        ipHash: "hash-a",
        device: "Chrome / macOS",
        reason: "oauth_sign_in",
        metadata: undefined,
      },
    })
  })

  it("auditDeny persiste evento DENY", async () => {
    await auditDeny({
      email: "blocked@example.com",
      ipHash: "hash-b",
      reason: "allowlist",
    })

    expect(accessAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: AccessAuditEvent.DENY,
        email: "blocked@example.com",
        reason: "allowlist",
      }),
    })
  })

  it("auditRevoke persiste metadata de sesiones revocadas", async () => {
    await auditRevoke({
      userId: "user-1",
      reason: "single_session",
      metadata: {
        revokedSessionIds: ["s1", "s2"],
        revokedCount: 2,
      },
    })

    expect(accessAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: AccessAuditEvent.REVOKE,
        userId: "user-1",
        reason: "single_session",
        metadata: {
          revokedSessionIds: ["s1", "s2"],
          revokedCount: 2,
        },
      }),
    })
  })

  it("auditIpChange persiste cambio de IP hasheada", async () => {
    await auditIpChange({
      userId: "user-1",
      sessionId: "session-1",
      ipHash: "hash-new",
      metadata: {
        previousIpHash: "hash-old",
        newIpHash: "hash-new",
      },
    })

    expect(accessAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: AccessAuditEvent.IP_CHANGE,
        userId: "user-1",
        sessionId: "session-1",
        ipHash: "hash-new",
        reason: "heartbeat_ip_change",
      }),
    })
  })

  it("no lanza si falla la escritura en DB", async () => {
    accessAuditCreate.mockRejectedValue(new Error("db down"))

    await expect(
      auditLogin({ userId: "user-1", email: "user@firma.com" }),
    ).resolves.toBeUndefined()
  })
})
