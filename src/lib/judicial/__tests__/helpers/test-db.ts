import { config } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { PrismaClient } from "@/generated/prisma/client"

config({ path: ".env.local", override: true, quiet: true })

export function createTestDb(): { db: PrismaClient; pool: Pool } {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("Falta DIRECT_URL o DATABASE_URL para tests de repository")
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  return {
    pool,
    db: new PrismaClient({ adapter: new PrismaPg(pool) }),
  }
}
