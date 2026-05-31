import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/demo-mode", () => ({
  isDemoAuthEnabled: () => false,
}))

const { findUnique, updateMany } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    session: {
      findUnique,
      updateMany,
    },
  },
}))

import {
  logoutAllSessions,
  toLogoutAllResponse,
} from "@/lib/auth/logout-all"

function mockRequest(cookie?: string) {
  return new Request("http://localhost/api/session/logout-all", {
    method: "POST",
    headers: cookie ? { cookie } : {},
  })
}

describe("logoutAllSessions", () => {
  beforeEach(() => {
    findUnique.mockReset()
    updateMany.mockReset()
  })

  it("devuelve unauthorized sin cookie", async () => {
    expect(await logoutAllSessions(mockRequest())).toEqual({
      status: "unauthorized",
    })
  })

  it("devuelve unauthorized si el token no existe", async () => {
    findUnique.mockResolvedValue(null)

    expect(
      await logoutAllSessions(
        mockRequest("authjs.session-token=missing-token"),
      ),
    ).toEqual({ status: "unauthorized" })
  })

  it("revoca todas las sesiones activas del usuario", async () => {
    findUnique.mockResolvedValue({ userId: "user-1" })
    updateMany.mockResolvedValue({ count: 2 })

    const result = await logoutAllSessions(
      mockRequest("authjs.session-token=current-token"),
    )

    expect(result).toEqual({ status: "ok", revokedCount: 2 })
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
  })
})

describe("toLogoutAllResponse", () => {
  it("devuelve revokedCount en JSON 200", async () => {
    const response = toLogoutAllResponse({ status: "ok", revokedCount: 3 })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ revokedCount: 3 })
  })
})
