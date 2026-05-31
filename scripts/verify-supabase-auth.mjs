import { config } from "dotenv"
import pg from "pg"

config({ path: ".env.local", override: true })

const expectedTables = [
  "User",
  "Account",
  "Session",
  "VerificationToken",
  "Allowlist",
  "_prisma_migrations",
]

async function verify(label, connectionString) {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  const tables = await client.query(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename = ANY($1::text[])
     ORDER BY tablename`,
    [expectedTables],
  )

  const found = tables.rows.map((row) => row.tablename)
  const missing = expectedTables.filter((name) => !found.includes(name))

  if (missing.length > 0) {
    throw new Error(`${label}: missing tables ${missing.join(", ")}`)
  }

  const roleEnum = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM pg_type t
       JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'public' AND t.typname = 'Role'
     ) AS exists`,
  )

  if (!roleEnum.rows[0]?.exists) {
    throw new Error(`${label}: enum Role not found`)
  }

  await client.query('SELECT COUNT(*) FROM "User"')
  await client.end()

  console.log(`${label}: OK (${found.join(", ")})`)
}

await verify("pooler:6543", process.env.DATABASE_URL)
await verify("pooler:5432", process.env.DIRECT_URL)

console.log("verify:supabase-auth-tables passed")
