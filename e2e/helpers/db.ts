import { config } from "dotenv"
import pg from "pg"

config({ path: ".env.local", override: true })

export const E2E_USER_EMAIL = "e2e@judiziala.local"

export async function cleanupE2eUser(): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL missing for E2E cleanup (.env.local)")
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    const user = await client.query<{ id: string }>(
      `SELECT id FROM "User" WHERE email = $1`,
      [E2E_USER_EMAIL],
    )

    if (user.rows.length === 0) return

    const userId = user.rows[0].id
    await client.query(`DELETE FROM "Session" WHERE "userId" = $1`, [userId])
    await client.query(`DELETE FROM "Account" WHERE "userId" = $1`, [userId])
    await client.query(`DELETE FROM "User" WHERE id = $1`, [userId])
  } finally {
    await client.end()
  }
}
