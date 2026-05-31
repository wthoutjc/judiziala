import "server-only"

import { getSessionExpiryReason } from "@/lib/auth/session-expiry"
import { readSessionTokenFromRequest } from "@/lib/auth/session-revocation"
import { isDemoAuthEnabled } from "@/lib/demo-mode"
import { db } from "@/lib/db"

export type CurrentSessionPayload = {
  device: string | null
  ipHash: string | null
  lastSeenAt: string
  expires: string
}

export type CurrentSessionResult =
  | { status: "ok"; session: CurrentSessionPayload }
  | { status: "revoked" }
  | { status: "idle" }
  | { status: "expired" }
  | { status: "unauthorized" }

export async function getCurrentSession(
  request: Request,
): Promise<CurrentSessionResult> {
  if (isDemoAuthEnabled()) {
    return {
      status: "ok",
      session: {
        device: "Demo",
        ipHash: null,
        lastSeenAt: new Date().toISOString(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    }
  }

  const sessionToken = readSessionTokenFromRequest(request)
  if (!sessionToken) return { status: "unauthorized" }

  const session = await db.session.findUnique({
    where: { sessionToken },
    select: {
      device: true,
      ipHash: true,
      lastSeenAt: true,
      expires: true,
      revokedAt: true,
    },
  })

  if (!session) return { status: "unauthorized" }

  const reason = getSessionExpiryReason(session)

  switch (reason) {
    case "revoked":
      return { status: "revoked" }
    case "idle":
      return { status: "idle" }
    case "absolute":
      return { status: "expired" }
    case "missing":
      return { status: "unauthorized" }
    case "ok":
      return {
        status: "ok",
        session: {
          device: session.device,
          ipHash: session.ipHash,
          lastSeenAt: session.lastSeenAt.toISOString(),
          expires: session.expires.toISOString(),
        },
      }
  }
}

export function toCurrentSessionResponse(result: CurrentSessionResult): Response {
  switch (result.status) {
    case "ok":
      return Response.json(result.session)
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
