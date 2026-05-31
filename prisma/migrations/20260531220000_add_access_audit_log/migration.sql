-- CreateEnum
CREATE TYPE "AccessAuditEvent" AS ENUM ('LOGIN', 'DENY', 'REVOKE', 'IP_CHANGE');

-- CreateTable
CREATE TABLE "AccessAuditLog" (
    "id" TEXT NOT NULL,
    "event" "AccessAuditEvent" NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "sessionId" TEXT,
    "ipHash" TEXT,
    "device" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessAuditLog_userId_createdAt_idx" ON "AccessAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AccessAuditLog_event_createdAt_idx" ON "AccessAuditLog"("event", "createdAt");
