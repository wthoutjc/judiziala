import "server-only"

import { auditRevoke } from "@/lib/auth/audit"
import { readSessionTokenFromRequest } from "@/lib/auth/session-revocation"
import { isDemoAuthEnabled } from "@/lib/demo-mode"
import { db } from "@/lib/db"

export type LogoutAllResult =
  | { status: "ok"; revokedCount: number }
  | { status: "unauthorized" }

export async function logoutAllSessions(
  request: Request,
): Promise<LogoutAllResult> {
  if (isDemoAuthEnabled()) {
    return { status: "ok", revokedCount: 0 }
  }

  const sessionToken = readSessionTokenFromRequest(request)
  if (!sessionToken) return { status: "unauthorized" }

  const session = await db.session.findUnique({
    where: { sessionToken },
    select: { userId: true },
  })

  if (!session) return { status: "unauthorized" }

  const sessionsToRevoke = await db.session.findMany({
    where: { userId: session.userId, revokedAt: null },
    select: { id: true },
  })

  const result = await db.session.updateMany({
    where: { userId: session.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })

  if (sessionsToRevoke.length > 0) {
    await auditRevoke({
      userId: session.userId,
      sessionId: sessionsToRevoke[0]?.id ?? null,
      reason: "logout_all",
      metadata: {
        revokedSessionIds: sessionsToRevoke.map((row) => row.id),
        revokedCount: result.count,
      },
    })
  }

  return { status: "ok", revokedCount: result.count }
}

export function toLogoutAllResponse(result: LogoutAllResult): Response {
  switch (result.status) {
    case "ok":
      return Response.json({ revokedCount: result.revokedCount })
    case "unauthorized":
      return Response.json({ error: "unauthorized" }, { status: 401 })
  }
}
