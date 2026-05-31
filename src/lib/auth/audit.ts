import "server-only"

import type { Prisma } from "@/generated/prisma/client"
import { AccessAuditEvent } from "@/generated/prisma/enums"
import { db } from "@/lib/db"

export type AuditContext = {
  userId?: string | null
  email?: string | null
  sessionId?: string | null
  ipHash?: string | null
  device?: string | null
  reason?: string | null
  metadata?: Prisma.InputJsonValue
}

async function writeAccessAudit(
  event: AccessAuditEvent,
  context: AuditContext,
): Promise<void> {
  try {
    await db.accessAuditLog.create({
      data: {
        event,
        userId: context.userId ?? undefined,
        email: context.email ?? undefined,
        sessionId: context.sessionId ?? undefined,
        ipHash: context.ipHash ?? undefined,
        device: context.device ?? undefined,
        reason: context.reason ?? undefined,
        metadata: context.metadata,
      },
    })
  } catch (error) {
    console.error("access audit write failed", error)
  }
}

export async function isAllowlistedEmail(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  const domain = normalizedEmail.split("@")[1]

  const allowlistCount = await db.allowlist.count()
  if (allowlistCount === 0) return true

  const match = await db.allowlist.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        ...(domain ? [{ domain: domain.toLowerCase() }] : []),
      ],
    },
    select: { id: true },
  })

  return match != null
}

export async function auditLogin(context: AuditContext): Promise<void> {
  await writeAccessAudit(AccessAuditEvent.LOGIN, {
    ...context,
    reason: context.reason ?? "oauth_sign_in",
  })
}

export async function auditDeny(context: AuditContext): Promise<void> {
  await writeAccessAudit(AccessAuditEvent.DENY, {
    ...context,
    reason: context.reason ?? "access_denied",
  })
}

export async function auditRevoke(context: AuditContext): Promise<void> {
  await writeAccessAudit(AccessAuditEvent.REVOKE, context)
}

export async function auditIpChange(context: AuditContext): Promise<void> {
  await writeAccessAudit(AccessAuditEvent.IP_CHANGE, {
    ...context,
    reason: context.reason ?? "heartbeat_ip_change",
  })
}

export { AccessAuditEvent }
