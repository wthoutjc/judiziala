import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/db", () => ({ db: {} }))

import type { PrismaClient } from "@/generated/prisma/client"
import { createSingleSessionAdapter } from "@/lib/auth/single-session"
import { isSessionRevoked } from "@/lib/auth/session-revocation"

type SessionRow = {
  id: string
  sessionToken: string
  userId: string
  expires: Date
  revokedAt: Date | null
  lastSeenAt: Date
}

const testUser = {
  id: "user-1",
  name: "Usuario Test",
  email: "test@judiziala.local",
  emailVerified: null,
  image: null,
  role: "ABOGADO" as const,
  createdAt: new Date(),
}

function createMockPrisma() {
  const sessions: SessionRow[] = []
  let idCounter = 0

  const sessionApi = {
    updateMany: async ({
      where,
      data,
    }: {
      where: { userId: string; revokedAt: null }
      data: { revokedAt: Date }
    }) => {
      let count = 0

      for (const session of sessions) {
        if (session.userId === where.userId && session.revokedAt === null) {
          session.revokedAt = data.revokedAt
          count++
        }
      }

      return { count }
    },
    create: async ({
      data,
    }: {
      data: {
        sessionToken: string
        userId: string
        expires: Date
      }
    }) => {
      const session: SessionRow = {
        id: `session-${++idCounter}`,
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: data.expires,
        revokedAt: null,
        lastSeenAt: new Date(),
      }

      sessions.push(session)
      return session
    },
    findUnique: async ({
      where,
      include,
    }: {
      where: { sessionToken: string }
      include?: { user: boolean }
    }) => {
      const session = sessions.find(
        (row) => row.sessionToken === where.sessionToken,
      )

      if (!session) return null
      if (include?.user) return { ...session, user: testUser }
      return session
    },
  }

  const prisma = {
    sessions,
    $transaction: async <T>(fn: (tx: { session: typeof sessionApi }) => Promise<T>) =>
      fn({ session: sessionApi }),
    session: sessionApi,
    user: {
      findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id === testUser.id || where.email === testUser.email) {
          return testUser
        }
        return null
      },
    },
    account: {
      findUnique: async () => null,
      create: async () => ({}),
      delete: async () => ({}),
    },
  }

  return prisma as typeof prisma & { sessions: SessionRow[] } & PrismaClient
}

describe("sesion unica", () => {
  let prisma: ReturnType<typeof createMockPrisma>
  let adapter: ReturnType<typeof createSingleSessionAdapter>
  const expires = new Date(Date.now() + 86_400_000)

  beforeEach(() => {
    prisma = createMockPrisma()
    adapter = createSingleSessionAdapter(prisma)
  })

  it("login B revoca A; A queda invalida", async () => {
    prisma.sessions.push({
      id: "session-a",
      sessionToken: "token-a",
      userId: testUser.id,
      expires,
      revokedAt: null,
      lastSeenAt: new Date(),
    })

    await adapter.createSession!({
      sessionToken: "token-b",
      userId: testUser.id,
      expires,
    })

    const sessionA = prisma.sessions.find((row) => row.sessionToken === "token-a")
    const sessionB = prisma.sessions.find((row) => row.sessionToken === "token-b")

    expect(sessionA?.revokedAt).not.toBeNull()
    expect(sessionB?.revokedAt).toBeNull()
    expect(isSessionRevoked(sessionA)).toBe(true)
    expect(isSessionRevoked(sessionB)).toBe(false)

    const lookupA = await adapter.getSessionAndUser!("token-a")
    const lookupB = await adapter.getSessionAndUser!("token-b")

    expect(lookupA).toBeNull()
    expect(lookupB).not.toBeNull()
    expect(lookupB?.session.sessionToken).toBe("token-b")
  })

  it("primer login no revoca otras sesiones de otros usuarios", async () => {
    prisma.sessions.push({
      id: "session-other",
      sessionToken: "token-other",
      userId: "user-2",
      expires,
      revokedAt: null,
      lastSeenAt: new Date(),
    })

    await adapter.createSession!({
      sessionToken: "token-b",
      userId: testUser.id,
      expires,
    })

    const otherSession = prisma.sessions.find(
      (row) => row.sessionToken === "token-other",
    )

    expect(otherSession?.revokedAt).toBeNull()
  })
})
