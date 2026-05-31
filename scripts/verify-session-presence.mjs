import { config } from "dotenv"
import pg from "pg"

config({ path: ".env.local", override: true })

async function verifySessionPresence(connectionString) {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  const columnResult = await client.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'Session'
       AND column_name = 'lastSeenAt'`,
  )

  if (columnResult.rows.length === 0) {
    throw new Error("Missing Session column: lastSeenAt")
  }

  const column = columnResult.rows[0]
  if (column.is_nullable !== "NO") {
    throw new Error("Session.lastSeenAt must be NOT NULL")
  }

  const indexResult = await client.query(
    `SELECT indexname, indexdef
     FROM pg_indexes
     WHERE schemaname = 'public'
       AND tablename = 'Session'
       AND indexname = 'Session_lastSeenAt_idx'`,
  )

  if (indexResult.rows.length === 0) {
    throw new Error("Missing index: Session_lastSeenAt_idx")
  }

  await client.end()

  console.log("Session presence OK:")
  console.log(
    `  - lastSeenAt (${column.data_type}, nullable=${column.is_nullable}, default=${column.column_default})`,
  )
  console.log(`  - ${indexResult.rows[0].indexname}`)
}

await verifySessionPresence(process.env.DIRECT_URL)
console.log("verify:session-presence passed")
