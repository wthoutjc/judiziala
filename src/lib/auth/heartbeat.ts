import "server-only"

import { auditIpChange } from "@/lib/auth/audit"
import { extractSessionMetadata } from "@/lib/auth/session-metadata"
import { readSessionTokenFromRequest } from "@/lib/auth/session-revocation"
import { getSessionExpiryReason } from "@/lib/auth/session-expiry"
import { isDemoAuthEnabled } from "@/lib/demo-mode"
import { db } from "@/lib/db"
import { env } from "@/lib/env"

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
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      expires: true,
      lastSeenAt: true,
      ipHash: true,
      device: true,
    },
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

  const metadata = extractSessionMetadata(request.headers, env.AUTH_SECRET)
  const now = new Date()

  if (
    metadata.ipHash &&
    session.ipHash &&
    metadata.ipHash !== session.ipHash
  ) {
    await auditIpChange({
      userId: session.userId,
      sessionId: session.id,
      ipHash: metadata.ipHash,
      device: metadata.device ?? session.device,
      reason: "heartbeat_ip_change",
      metadata: {
        previousIpHash: session.ipHash,
        newIpHash: metadata.ipHash,
      },
    })
  }

  await db.session.update({
    where: { sessionToken },
    data: {
      lastSeenAt: now,
      ...(metadata.ipHash ? { ipHash: metadata.ipHash } : {}),
      ...(metadata.device ? { device: metadata.device } : {}),
    },
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
