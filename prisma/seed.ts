import { readFileSync } from "node:fs"
import { join } from "node:path"
import { config } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { cpnuProcesoCompleto } from "../src/lib/judicial/adapter"
import {
  parseActuacionesResponse,
  parseConsultaResponse,
  parseDetalleResponse,
} from "../src/lib/judicial/cpnu.schemas"
import { persistProcesoFromDomain } from "../src/lib/judicial/persist"

config({ path: ".env.local", override: true, quiet: true })

const DEFAULT_SEED_EMAIL = "dev@judiziala.local"
const fixturesDir = join(__dirname, "../src/lib/judicial/__fixtures__")

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"))
}

function createSeedDb(): { db: PrismaClient; pool: Pool } {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("Falta DIRECT_URL o DATABASE_URL en .env.local")
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

async function resolveSeedUser(db: PrismaClient) {
  const configuredEmail = process.env.SEED_USER_EMAIL?.trim()

  if (configuredEmail) {
    return db.user.upsert({
      where: { email: configuredEmail },
      create: {
        email: configuredEmail,
        name: "Dev Seed",
        role: "ABOGADO",
      },
      update: {
        name: "Dev Seed",
      },
    })
  }

  const existingUser = await db.user.findFirst({
    orderBy: { createdAt: "asc" },
  })

  if (existingUser) {
    return existingUser
  }

  return db.user.create({
    data: {
      email: DEFAULT_SEED_EMAIL,
      name: "Dev Seed",
      role: "ABOGADO",
    },
  })
}

async function main() {
  const { db, pool } = createSeedDb()

  try {
    const user = await resolveSeedUser(db)

    const consulta = parseConsultaResponse(loadFixture("consulta-radicado.json"))
    const detalle = parseDetalleResponse(loadFixture("detalle-proceso.json"))
    const actuacionesResponse = parseActuacionesResponse(
      loadFixture("actuaciones-proceso.json")
    )
    const cpnuProceso = consulta.procesos[0]

    const { proceso, actuaciones } = cpnuProcesoCompleto(
      cpnuProceso,
      detalle,
      actuacionesResponse.actuaciones
    )

    const procesoId = await db.$transaction(async (tx) => {
      const id = await persistProcesoFromDomain(tx, proceso, actuaciones)

      await tx.monitoreoProceso.upsert({
        where: { userId_procesoId: { userId: user.id, procesoId: id } },
        create: { userId: user.id, procesoId: id },
        update: {},
      })

      return id
    })

    console.log(
      [
        "Seed judicial OK",
        `proceso=${proceso.radicado}`,
        `id=${procesoId}`,
        `usuario=${user.email}`,
        `actuaciones=${actuaciones.length}`,
        `partes=${proceso.partes.length}`,
      ].join(" | ")
    )
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error("Seed judicial fallo:", error)
  process.exit(1)
})
