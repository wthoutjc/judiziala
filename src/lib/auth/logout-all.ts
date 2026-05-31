import "server-only"

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

  const result = await db.session.updateMany({
    where: { userId: session.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })

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
