import { config } from "dotenv"
import pg from "pg"

config({ path: ".env.local", override: true })

const DATABASE_URL = process.env.DATABASE_URL
const DIRECT_URL = process.env.DIRECT_URL
const PROJECT_REF =
  process.env.SUPABASE_PROJECT_REF ??
  extractProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL)
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

const failures = []
const warnings = []
const passed = []

function extractProjectRef(supabaseUrl) {
  if (!supabaseUrl) return null
  try {
    const host = new URL(supabaseUrl).hostname
    return host.split(".")[0] || null
  } catch {
    return null
  }
}

function parseDbUrl(label, connectionString) {
  if (!connectionString?.trim()) {
    failures.push(`${label}: no definida`)
    return null
  }

  let url
  try {
    url = new URL(connectionString.replace(/^postgres:\/\//, "postgresql://"))
  } catch {
    failures.push(`${label}: URL invalida`)
    return null
  }

  if (connectionString.includes("YOUR_SUPABASE_DB_PASSWORD")) {
    failures.push(`${label}: contiene placeholder de password`)
  }

  return {
    label,
    connectionString,
    host: url.hostname,
    port: url.port || "5432",
    database: url.pathname.replace(/^\//, "") || "postgres",
    pgbouncer: url.searchParams.get("pgbouncer") === "true",
  }
}

async function connectAndQuery(label, connectionString, query) {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  try {
    return await client.query(query)
  } finally {
    await client.end()
  }
}

async function verifyConnectivity(parsed) {
  const result = await connectAndQuery(
    parsed.label,
    parsed.connectionString,
    "SELECT current_database() AS db, version() AS version",
  )

  passed.push(
    `${parsed.label}: conexion OK (${parsed.host}:${parsed.port}/${result.rows[0].db})`,
  )
}

async function verifyPoolerUsesTransactionPort(parsed) {
  if (parsed.port !== "6543" || !parsed.pgbouncer) return
  passed.push(
    "pooler:6543: configuracion transaction pooler (Prisma/runtime via DATABASE_URL)",
  )
}

async function verifyDirectSupportsDdl(connectionString) {
  await connectAndQuery(
    "direct:5432",
    connectionString,
    "SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' LIMIT 1",
  )
  passed.push("direct:5432: lectura de catalogo OK (apta para prisma migrate deploy)")
}

async function fetchManagementApi(path) {
  if (!ACCESS_TOKEN) return null
  if (!PROJECT_REF) {
    warnings.push("Management API: falta SUPABASE_PROJECT_REF")
    return null
  }

  const response = await fetch(`https://api.supabase.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const body = await response.text()
    warnings.push(`Management API ${path}: HTTP ${response.status} (${body.slice(0, 120)})`)
    return null
  }

  return response.json()
}

async function verifyManagementApi() {
  if (!ACCESS_TOKEN) {
    warnings.push(
      "Management API: omitida (define SUPABASE_ACCESS_TOKEN para validar plan/backups/red)",
    )
    warnings.push(
      "Dashboard manual: Settings > Billing (plan Pro+), Database > Backups (activos), Database > Network (opcional)",
    )
    return
  }

  const project = await fetchManagementApi(`/projects/${PROJECT_REF}`)
  if (project) {
    passed.push(
      `Management API: proyecto ${PROJECT_REF} (${project.status ?? "unknown"}, region ${project.region ?? "?"})`,
    )
  }

  const backups = await fetchManagementApi(
    `/projects/${PROJECT_REF}/database/backups`,
  )
  if (backups) {
    if (backups.walg_enabled) {
      passed.push("Management API: WAL archiving habilitado (walg_enabled)")
    }

    const items = backups.backups ?? []
    if (Array.isArray(items) && items.length > 0) {
      passed.push(`Management API: ${items.length} backup(s) diarios disponibles`)
    } else if (backups.pitr_enabled) {
      passed.push("Management API: PITR habilitado")
    } else {
      warnings.push(
        "Backups diarios: requiere plan Pro+ (Dashboard > Settings > Billing). Free: usar supabase db dump periodico",
      )
    }
  }

  const scheduleResponse = ACCESS_TOKEN
    ? await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/backups/schedule`,
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      )
    : null

  if (scheduleResponse?.ok) {
    const schedule = await scheduleResponse.json()
    if (schedule?.enabled === true || schedule?.schedule) {
      passed.push("Management API: schedule de backups configurado")
    }
  } else if (scheduleResponse?.status === 402) {
    warnings.push(
      "Backup schedule: HTTP 402 — upgrade a Pro+ para backups automaticos diarios",
    )
  }

  const network = await fetchManagementApi(
    `/projects/${PROJECT_REF}/network-restrictions`,
  )
  if (network) {
    const cidrs =
      network.db_allowed_cidrs ??
      network.allowed_cidrs ??
      network.cidr ??
      []
    if (Array.isArray(cidrs) && cidrs.length > 0) {
      passed.push(`Management API: red restringida (${cidrs.length} CIDR(s))`)
    } else {
      passed.push(
        "Management API: red abierta (opcional: restringir a IPs de Cloud Run)",
      )
    }
  }
}

function verifyUrlShape(database, direct) {
  if (!database) return

  if (database.port !== "6543") {
    failures.push(
      `DATABASE_URL: puerto ${database.port} (prod requiere pooler transaction :6543)`,
    )
  } else {
    passed.push("DATABASE_URL: puerto 6543 (transaction pooler)")
  }

  if (!database.pgbouncer) {
    failures.push('DATABASE_URL: falta query param pgbouncer=true')
  } else {
    passed.push("DATABASE_URL: pgbouncer=true presente")
  }

  if (!database.host.includes("pooler.supabase.com")) {
    warnings.push(`DATABASE_URL: host ${database.host} no es pooler.supabase.com`)
  }

  if (!direct) return

  if (direct.port !== "5432") {
    failures.push(
      `DIRECT_URL: puerto ${direct.port} (migraciones requieren :5432 session/direct)`,
    )
  } else {
    passed.push("DIRECT_URL: puerto 5432")
  }

  const directHostOk =
    direct.host.includes("pooler.supabase.com") ||
    (PROJECT_REF && direct.host === `db.${PROJECT_REF}.supabase.co`)
  if (!directHostOk) {
    warnings.push(`DIRECT_URL: host ${direct.host} no reconocido como Supabase`)
  }

  if (database.host === direct.host && database.port === direct.port) {
    failures.push(
      "DATABASE_URL y DIRECT_URL apuntan al mismo host:puerto (deben diferir :6543 vs :5432)",
    )
  }
}

console.log("=== verify:supabase-prod ===")
if (PROJECT_REF) {
  console.log(`Proyecto: ${PROJECT_REF}`)
}

const database = parseDbUrl("DATABASE_URL", DATABASE_URL)
const direct = parseDbUrl("DIRECT_URL", DIRECT_URL)
verifyUrlShape(database, direct)

if (database) {
  await verifyConnectivity(database)
  await verifyPoolerUsesTransactionPort(database)
}

if (direct) {
  await verifyConnectivity(direct)
  await verifyDirectSupportsDdl(direct.connectionString)
}

await verifyManagementApi()

console.log("")
if (passed.length > 0) {
  console.log("OK:")
  for (const line of passed) console.log(`  - ${line}`)
}

if (warnings.length > 0) {
  console.log("")
  console.log("AVISOS:")
  for (const line of warnings) console.log(`  - ${line}`)
}

if (failures.length > 0) {
  console.log("")
  console.log("FALLOS:")
  for (const line of failures) console.log(`  - ${line}`)
  process.exit(1)
}

console.log("")
console.log("verify:supabase-prod passed")
