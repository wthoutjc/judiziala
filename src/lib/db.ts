import "server-only"

import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { PrismaClient } from "@/generated/prisma/client"
import { env } from "@/lib/env"

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
  pgPool?: Pool
}

function createPrismaClient(): PrismaClient {
  const connectionString = env.DATABASE_URL

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool
  }

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}
