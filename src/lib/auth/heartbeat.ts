import "server-only"

import { readSessionTokenFromRequest } from "@/lib/auth/session-revocation"
import { getSessionExpiryReason } from "@/lib/auth/session-expiry"
import { isDemoAuthEnabled } from "@/lib/demo-mode"
import { db } from "@/lib/db"

export type HeartbeatStatus =
  | "ok"
  | "revoked"
  | "idle"
  | "expired"
  | "unauthorized"

export async function runHeartbeat(request: Request): Promise<HeartbeatStatus> {
  if (isDemoAuthEnabled()) return "ok"

  const sessionToken = readSessionTokenFromRequest(request)
  if (!sessionToken) return "unauthorized"

  const session = await db.session.findUnique({
    where: { sessionToken },
    select: { revokedAt: true, expires: true, lastSeenAt: true },
  })

  if (!session) return "unauthorized"

  const reason = getSessionExpiryReason(session)

  switch (reason) {
    case "revoked":
      return "revoked"
    case "idle":
      return "idle"
    case "absolute":
      return "expired"
    case "missing":
      return "unauthorized"
    case "ok":
      break
  }

  await db.session.update({
    where: { sessionToken },
    data: { lastSeenAt: new Date() },
  })

  return "ok"
}

export function toHeartbeatResponse(status: HeartbeatStatus): Response {
  switch (status) {
    case "ok":
      return new Response(null, { status: 204 })
    case "revoked":
      return Response.json({ error: "session_revoked" }, { status: 401 })
    case "idle":
      return Response.json({ error: "session_idle" }, { status: 401 })
    case "expired":
      return Response.json({ error: "session_expired" }, { status: 401 })
    case "unauthorized":
      return Response.json({ error: "unauthorized" }, { status: 401 })
  }
}
