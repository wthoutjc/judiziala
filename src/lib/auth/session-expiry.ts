import "server-only"

import { readSessionTokenFromRequest } from "@/lib/auth/session-revocation"
import { isDemoAuthEnabled } from "@/lib/demo-mode"
import { db } from "@/lib/db"

export const SESSION_ABSOLUTE_MAX_AGE_SEC = 12 * 60 * 60
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000

export type SessionExpiryReason =
  | "ok"
  | "revoked"
  | "idle"
  | "absolute"
  | "missing"

export type SessionTimestamps = {
  revokedAt?: Date | null
  expires: Date
  lastSeenAt: Date
}

export function getSessionExpiryReason(
  session: SessionTimestamps | null | undefined,
  now = Date.now(),
): SessionExpiryReason {
  if (!session) return "missing"
  if (session.revokedAt != null) return "revoked"
  if (session.expires.getTime() <= now) return "absolute"
  if (session.lastSeenAt.getTime() + SESSION_IDLE_TIMEOUT_MS <= now) return "idle"
  return "ok"
}

export async function getSessionExpiryFromRequest(
  request: Request,
): Promise<SessionExpiryReason> {
  if (isDemoAuthEnabled()) return "ok"

  const sessionToken = readSessionTokenFromRequest(request)
  if (!sessionToken) return "missing"

  const session = await db.session.findUnique({
    where: { sessionToken },
    select: { revokedAt: true, expires: true, lastSeenAt: true },
  })

  return getSessionExpiryReason(session)
}
