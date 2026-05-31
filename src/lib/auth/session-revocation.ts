import "server-only"

import { readSessionTokenFromRequest } from "@/lib/auth/session-cookie-edge"
import { db } from "@/lib/db"

export { readSessionTokenFromRequest } from "@/lib/auth/session-cookie-edge"

export async function isSessionTokenRevoked(
  sessionToken: string,
): Promise<boolean> {
  const session = await db.session.findUnique({
    where: { sessionToken },
    select: { revokedAt: true },
  })

  return session?.revokedAt != null
}

export async function isRevokedSessionRequest(
  request: Request,
): Promise<boolean> {
  const sessionToken = readSessionTokenFromRequest(request)
  if (!sessionToken) return false

  return isSessionTokenRevoked(sessionToken)
}

export function isSessionRevoked(
  session: { revokedAt?: Date | null } | null | undefined,
): boolean {
  return session?.revokedAt != null
}
