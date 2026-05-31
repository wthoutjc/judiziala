/**
 * Regenera catalogos DANE desde fuente publica (JSONCodigosDane / geoportal DANE).
 * Uso: npx tsx scripts/generar-catalogos.ts
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const OUT_DIR = join(__dirname, "../src/lib/judicial/catalogos/data")
const DANE_JSON_URL =
  "https://raw.githubusercontent.com/dogia/JSONCodigosDane/master/codigos.dev"
const DANE_DEPTOS_URL =
  "https://geoportal.dane.gov.co/laboratorio/serviciosjson/gdivipola/servicios/departamentos.php"
const DANE_MUNICIPIOS_URL =
  "https://geoportal.dane.gov.co/laboratorio/serviciosjson/gdivipola/servicios/municipios.php"

type DeptoEntry = { codigo: string; nombre: string; aliases: string[] }
type MunicipioEntry = {
  depto: string
  codigo: string
  nombre: string
  aliases: string[]
}

function normalizarTexto(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

function aliasFromNombre(nombre: string): string[] {
  const base = normalizarTexto(nombre)
  const aliases = new Set<string>([base])
  if (base.includes(" d.c.")) aliases.add(base.replace(" d.c.", ""))
  if (base.includes(" dc")) aliases.add(base.replace(" dc", ""))
  return [...aliases]
}

function padDepto(code: string): string {
  return code.padStart(2, "0").slice(-2)
}

function padCiudad(code: string): string {
  return code.padStart(3, "0").slice(-3)
}

function splitCodigoDane(codigo5: string): { depto: string; ciudad: string } {
  const digits = codigo5.replace(/\D/g, "").padStart(5, "0")
  return {
    depto: padDepto(digits.slice(0, 2)),
    ciudad: padCiudad(digits.slice(2, 5)),
  }
}

async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs = 30_000
): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

type DaneGeoportalDepto = { cod_dpto: string; dpto: string }
type DaneGeoportalMunicipio = {
  cod_dpto: string
  cod_mpio: string
  dpto: string
  nom_mpio: string
}

async function loadFromGeoportal(): Promise<{
  departamentos: DeptoEntry[]
  municipios: MunicipioEntry[]
} | null> {
  const [deptosRaw, munRaw] = await Promise.all([
    fetchJsonWithTimeout<DaneGeoportalDepto[]>(DANE_DEPTOS_URL, 45_000),
    fetchJsonWithTimeout<DaneGeoportalMunicipio[]>(DANE_MUNICIPIOS_URL, 90_000),
  ])

  if (!deptosRaw?.length || !munRaw?.length) return null

  const departamentos: DeptoEntry[] = deptosRaw.map((d) => ({
    codigo: padDepto(String(d.cod_dpto)),
    nombre: d.dpto.trim(),
    aliases: aliasFromNombre(d.dpto),
  }))

  const municipios: MunicipioEntry[] = munRaw.map((m) => {
    const depto = padDepto(String(m.cod_dpto))
    const codigo = padCiudad(String(m.cod_mpio))
    return {
      depto,
      codigo,
      nombre: m.nom_mpio.trim(),
      aliases: aliasFromNombre(m.nom_mpio),
    }
  })

  return { departamentos, municipios }
}

async function loadFromJsonCodigosDane(): Promise<{
  departamentos: DeptoEntry[]
  municipios: MunicipioEntry[]
}> {
  const res = await fetch(DANE_JSON_URL)
  if (!res.ok) throw new Error(`No se pudo descargar ${DANE_JSON_URL}`)
  const byDepto = (await res.json()) as Record<
    string,
    { municipio: string; codigo: string }[]
  >

  const departamentos: DeptoEntry[] = []
  const municipios: MunicipioEntry[] = []

  for (const [deptoNombre, lista] of Object.entries(byDepto)) {
    if (!lista.length) continue
    const { depto } = splitCodigoDane(lista[0].codigo)
    departamentos.push({
      codigo: depto,
      nombre: deptoNombre.trim(),
      aliases: aliasFromNombre(deptoNombre),
    })

    for (const item of lista) {
      const parts = splitCodigoDane(item.codigo)
      municipios.push({
        depto: parts.depto,
        codigo: parts.ciudad,
        nombre: item.municipio.trim(),
        aliases: aliasFromNombre(item.municipio),
      })
    }
  }

  return { departamentos, municipios }
}

const ESPECIALIDADES = [
  { codigo: "40", nombre: "Civil municipal", aliases: ["civil municipal", "civil"] },
  { codigo: "41", nombre: "Civil circuito", aliases: ["civil circuito", "civil del circuito"] },
  { codigo: "44", nombre: "Restitucion de tierras", aliases: ["restitucion", "tierras"] },
  { codigo: "46", nombre: "Pequenas causas", aliases: ["pequenas causas", "minimo cuantia"] },
  { codigo: "50", nombre: "Laboral municipal", aliases: ["laboral municipal", "laboral"] },
  { codigo: "51", nombre: "Laboral circuito", aliases: ["laboral circuito"] },
  { codigo: "60", nombre: "Penal circuito", aliases: ["penal", "penales", "penal circuito", "penal del circuito"] },
  { codigo: "61", nombre: "Penal municipal", aliases: ["penal municipal"] },
  { codigo: "62", nombre: "Penal especial", aliases: ["penal especial", "justicia y paz"] },
  { codigo: "63", nombre: "Ejecucion de penas", aliases: ["ejecucion de penas", "ejecucion penas"] },
  { codigo: "64", nombre: "Penal adolescentes", aliases: ["penal adolescentes", "adolescentes"] },
  { codigo: "70", nombre: "Familia", aliases: ["familia", "de familia"] },
  { codigo: "71", nombre: "Familia circuito", aliases: ["familia circuito"] },
  { codigo: "72", nombre: "Familia especial", aliases: ["familia especial"] },
  { codigo: "31", nombre: "Penal conocimiento", aliases: ["penal conocimiento", "conocimiento penal"] },
]

async function main() {
  console.log("Generando catalogos DANE...")
  const geoportal = await loadFromGeoportal()
  const source = geoportal ?? (await loadFromJsonCodigosDane())
  console.log(
    geoportal
      ? "Fuente: geoportal DANE"
      : "Fuente: JSONCodigosDane (fallback)"
  )

  departamentosSort(source.departamentos)
  municipiosSort(source.municipios)

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(
    join(OUT_DIR, "dane-departamentos.json"),
    JSON.stringify(source.departamentos, null, 2)
  )
  writeFileSync(
    join(OUT_DIR, "dane-municipios.json"),
    JSON.stringify(source.municipios, null, 2)
  )
  writeFileSync(
    join(OUT_DIR, "especialidades-judiciales.json"),
    JSON.stringify(ESPECIALIDADES, null, 2)
  )

  console.log(
    `OK: ${source.departamentos.length} deptos, ${source.municipios.length} municipios, ${ESPECIALIDADES.length} especialidades`
  )
}

function departamentosSort(list: DeptoEntry[]) {
  list.sort((a, b) => a.codigo.localeCompare(b.codigo))
}

function municipiosSort(list: MunicipioEntry[]) {
  list.sort((a, b) =>
    `${a.depto}-${a.codigo}`.localeCompare(`${b.depto}-${b.codigo}`)
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
