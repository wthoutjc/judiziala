import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { config } from "dotenv"
import { createCpnuClient } from "../src/lib/judicial/cpnu-client.impl"

config({ path: ".env.local", override: true, quiet: true })

const cpnuClient = createCpnuClient()
const EXISTING_RADICADO = "05001600020620201819700"
const outDir = join(__dirname, "../src/lib/judicial/__fixtures__")

type CpnuProcesoCandidate = {
  idProceso: number
  llaveProceso: string
  fechaProceso: string | null
  fechaUltimaActuacion: string | null
}

async function searchProcesos(nombre: string, tipoPersona: "nat" | "jur") {
  const data = (await cpnuClient.fetchJson(
    "/api/v2/Procesos/Consulta/NombreRazonSocial",
    {
      nombre,
      tipoPersona,
      SoloActivos: false,
      codificacionDespacho: "",
      pagina: 1,
    }
  )) as { procesos?: CpnuProcesoCandidate[] }

  return (data.procesos ?? []).filter(
    (proceso) =>
      typeof proceso.idProceso === "number" &&
      typeof proceso.llaveProceso === "string" &&
      /^\d{23}$/.test(proceso.llaveProceso) &&
      typeof proceso.fechaProceso === "string" &&
      typeof proceso.fechaUltimaActuacion === "string"
  )
}

async function captureProcess(idProceso: number, slug: string) {
  const detalle = await cpnuClient.detalle(idProceso)
  const consulta = await cpnuClient.porRadicado(detalle.llaveProceso)
  const actuaciones = await cpnuClient.actuaciones(idProceso, { pagina: 1 })

  writeFileSync(join(outDir, `consulta-${slug}.json`), JSON.stringify(consulta, null, 2))
  writeFileSync(join(outDir, `detalle-${slug}.json`), JSON.stringify(detalle, null, 2))
  writeFileSync(
    join(outDir, `actuaciones-${slug}.json`),
    JSON.stringify(actuaciones, null, 2)
  )

  console.log(`Captured ${slug}: ${detalle.llaveProceso} (${idProceso})`)
}

async function main() {
  mkdirSync(outDir, { recursive: true })

  const searches: Array<[string, "nat" | "jur"]> = [
    ["SEBASTIAN LOPEZ GOMEZ", "nat"],
    ["LINA MARCELA LOPERA ARIAS", "nat"],
    ["BANCO DE OCCIDENTE", "jur"],
  ]

  const seenRadicados = new Set([EXISTING_RADICADO])
  const selected: Array<{ idProceso: number; llaveProceso: string }> = []

  for (const [nombre, tipoPersona] of searches) {
    if (selected.length >= 2) break

    const procesos = await searchProcesos(nombre, tipoPersona)

    for (const proceso of procesos) {
      if (seenRadicados.has(proceso.llaveProceso)) continue
      seenRadicados.add(proceso.llaveProceso)
      selected.push({
        idProceso: proceso.idProceso,
        llaveProceso: proceso.llaveProceso,
      })
      if (selected.length >= 2) break
    }
  }

  if (selected.length < 2) {
    throw new Error(`Solo se encontraron ${selected.length} procesos adicionales en CPNU`)
  }

  await captureProcess(selected[0].idProceso, "extra-1")
  await captureProcess(selected[1].idProceso, "extra-2")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
