import { config } from "dotenv"
import pg from "pg"

config({ path: ".env.local", override: true })

const expectedColumns = [
  "device",
  "ipHash",
  "lastSeenAt",
  "revokedAt",
  "userAgent",
]

async function verifySessionColumns(connectionString) {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  const result = await client.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'Session'
       AND column_name = ANY($1::text[])
     ORDER BY column_name`,
    [expectedColumns],
  )

  const found = result.rows.map((row) => row.column_name)
  const missing = expectedColumns.filter((name) => !found.includes(name))

  if (missing.length > 0) {
    throw new Error(`Missing Session columns: ${missing.join(", ")}`)
  }

  await client.end()

  console.log("Session metadata columns OK:")
  for (const row of result.rows) {
    console.log(`  - ${row.column_name} (${row.data_type}, nullable=${row.is_nullable})`)
  }
}

await verifySessionColumns(process.env.DIRECT_URL)
console.log("verify:session-metadata passed")
