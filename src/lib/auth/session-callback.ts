import "server-only"

import { getSessionExpiryReason } from "@/lib/auth/session-expiry"
import { db } from "@/lib/db"

export async function getSessionExpiryForToken(
  sessionToken: string | null | undefined,
) {
  if (!sessionToken) return "missing" as const

  const session = await db.session.findUnique({
    where: { sessionToken },
    select: { revokedAt: true, expires: true, lastSeenAt: true },
  })

  return getSessionExpiryReason(session)
}

export function shouldInvalidateSession(
  reason: ReturnType<typeof getSessionExpiryReason>,
): boolean {
  return reason === "revoked" || reason === "idle" || reason === "absolute"
}
