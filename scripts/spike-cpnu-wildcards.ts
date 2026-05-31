/**
 * Spike CPNU: prueba radicados construidos con wildcards.
 * Uso: npx tsx scripts/spike-cpnu-wildcards.ts
 */
import { config } from "dotenv"
import { createCpnuClient } from "../src/lib/judicial/cpnu-client.impl"
import { buildRadicadoWildcard } from "../src/lib/judicial/catalogos"
import { normalizarEntidades } from "../src/lib/judicial/catalogos"

config({ path: ".env.local", override: true, quiet: true })

const client = createCpnuClient()
const TARGET = "05001600020620201819700"

async function tryRadicado(label: string, radicado: string) {
  try {
    const data = await client.porRadicado(radicado)
    const found = data.procesos.some((p) => p.llaveProceso === TARGET)
    console.log(
      `${label}: ${radicado} -> ${data.procesos.length} proc(s) target=${found}`
    )
    return found
  } catch (err) {
    console.log(`${label}: ${radicado} -> ERROR ${String(err)}`)
    return false
  }
}

async function main() {
  const norm = normalizarEntidades({
    depto: "Antioquia",
    ciudad: "Medellin",
    especialidad: "penal",
    anio: 2020,
  })

  const wildcard = buildRadicadoWildcard(norm.codigos, 2020)
  console.log("Wildcard construido:", wildcard)
  console.log("Codigos:", JSON.stringify(norm.codigos, null, 2))

  if (wildcard) {
    await tryRadicado("wildcard catalogos", wildcard)
  }

  await tryRadicado("exacto fixture", TARGET)
  await tryRadicado("consecutivo wildcard", "05001600020620200000000")

  // codificacionDespacho en porNombre
  const prefixes = ["05", "05001", "0500160", "050013109001"]
  for (const prefix of prefixes) {
    try {
      const data = await client.porNombre("EDIBER CEFERINO RINCON", "nat", {
        codificacionDespacho: prefix,
      })
      const found = data.procesos.some((p) => p.llaveProceso === TARGET)
      console.log(
        `porNombre codificacion=${prefix} -> ${data.procesos.length} proc(s) target=${found}`
      )
    } catch (err) {
      console.log(`porNombre codificacion=${prefix} -> ERROR ${String(err)}`)
    }
  }
}

main().catch(console.error)
