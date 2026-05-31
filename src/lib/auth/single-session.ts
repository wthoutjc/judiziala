import "server-only"

import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "@auth/core/adapters"
import type { PrismaClient } from "@/generated/prisma/client"
import { getSessionExpiryReason } from "@/lib/auth/session-expiry"

export function createSingleSessionAdapter(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma)

  return {
    ...base,
    async getSessionAndUser(sessionToken) {
      const result = await base.getSessionAndUser!(sessionToken)
      if (!result) return null

      const reason = getSessionExpiryReason(
        result.session as unknown as {
          revokedAt?: Date | null
          expires: Date
          lastSeenAt: Date
        },
      )

      if (reason !== "ok") return null

      return result
    },
    async updateSession(data) {
      const existing = await prisma.session.findUnique({
        where: { sessionToken: data.sessionToken },
      })

      if (!existing) {
        return base.updateSession!(data)
      }

      return existing
    },
    async createSession(data) {
      const now = new Date()

      return prisma.$transaction(async (tx) => {
        await tx.session.updateMany({
          where: { userId: data.userId, revokedAt: null },
          data: { revokedAt: now },
        })

        return tx.session.create({
          data: {
            sessionToken: data.sessionToken,
            userId: data.userId,
            expires: data.expires,
          },
        })
      })
    },
  }
}
