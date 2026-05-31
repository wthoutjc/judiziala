import type { NlEntidades } from "./nl-schema"
import { buildRadicado } from "./radicado-builder"
import departamentosData from "./catalogos/data/dane-departamentos.json"
import municipiosData from "./catalogos/data/dane-municipios.json"
import especialidadesData from "./catalogos/data/especialidades-judiciales.json"
import despachosData from "./catalogos/data/despachos-judiciales.json"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ResolucionConfianza = "exact" | "alias" | "fuzzy"

export type CodigoResuelto = {
  codigo: string
  label: string
  confianza: ResolucionConfianza
}

export type CodigosResueltos = Partial<{
  depto: CodigoResuelto
  ciudad: CodigoResuelto
  especialidad: CodigoResuelto
  /** codigo = codDespachoCompleto (12 dígitos), resuelto desde nombre de juzgado/despacho */
  despacho: CodigoResuelto
}>

export type EntidadesNormalizadas = {
  entidades: NlEntidades
  codigos: CodigosResueltos
  noResueltos: (keyof NlEntidades)[]
}

type CatalogoEntry = {
  codigo: string
  nombre: string
  aliases: string[]
}

type MunicipioEntry = CatalogoEntry & { depto: string }

type DespachoEntry = {
  codDespachoCompleto: string
  nombre: string
  depto: string
  ciudad: string
  especialidad: string
  aliases: string[]
}

// ─── Indices (lazy) ───────────────────────────────────────────────────────────

let deptoIndex: Map<string, CatalogoEntry> | undefined
let municipioIndex: Map<string, MunicipioEntry[]> | undefined
let espIndex: Map<string, CatalogoEntry> | undefined
let despachoIndex: Map<string, DespachoEntry> | undefined

export function normalizarTextoBusqueda(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

function getDeptoIndex(): Map<string, CatalogoEntry> {
  if (deptoIndex) return deptoIndex
  deptoIndex = new Map()
  for (const entry of departamentosData as CatalogoEntry[]) {
    deptoIndex.set(entry.codigo, entry)
    for (const alias of entry.aliases) {
      deptoIndex.set(`alias:${alias}`, entry)
    }
    deptoIndex.set(`alias:${normalizarTextoBusqueda(entry.nombre)}`, entry)
  }
  return deptoIndex
}

function getMunicipioIndex(): Map<string, MunicipioEntry[]> {
  if (municipioIndex) return municipioIndex
  municipioIndex = new Map()
  for (const entry of municipiosData as MunicipioEntry[]) {
    const byDepto = municipioIndex.get(entry.depto) ?? []
    byDepto.push(entry)
    municipioIndex.set(entry.depto, byDepto)

    const globalKey = `alias:${normalizarTextoBusqueda(entry.nombre)}`
    const globalList = municipioIndex.get(globalKey) ?? []
    globalList.push(entry)
    municipioIndex.set(globalKey, globalList)
  }
  return municipioIndex
}

function getEspIndex(): Map<string, CatalogoEntry> {
  if (espIndex) return espIndex
  espIndex = new Map()
  for (const entry of especialidadesData as CatalogoEntry[]) {
    espIndex.set(entry.codigo, entry)
    for (const alias of entry.aliases) {
      espIndex.set(`alias:${alias}`, entry)
    }
    espIndex.set(`alias:${normalizarTextoBusqueda(entry.nombre)}`, entry)
  }
  return espIndex
}

function resolverDesdeIndice(
  texto: string,
  index: Map<string, CatalogoEntry>
): CodigoResuelto | null {
  const norm = normalizarTextoBusqueda(texto)
  if (!norm) return null

  const byAlias = index.get(`alias:${norm}`)
  if (byAlias) {
    return {
      codigo: byAlias.codigo,
      label: byAlias.nombre,
      confianza: "alias",
    }
  }

  for (const entry of index.values()) {
    if (entry.codigo.startsWith("alias:")) continue
    const entryNorm = normalizarTextoBusqueda(entry.nombre)
    if (entryNorm === norm) {
      return { codigo: entry.codigo, label: entry.nombre, confianza: "exact" }
    }
    if (entryNorm.includes(norm) || norm.includes(entryNorm)) {
      return { codigo: entry.codigo, label: entry.nombre, confianza: "fuzzy" }
    }
  }

  return null
}

export function resolverDepto(texto: string): CodigoResuelto | null {
  return resolverDesdeIndice(texto, getDeptoIndex())
}

export function resolverCiudad(
  deptoCodigo: string,
  texto: string
): CodigoResuelto | null {
  const norm = normalizarTextoBusqueda(texto)
  if (!norm) return null

  if (!deptoCodigo) {
    const globalMatches = getMunicipioIndex().get(`alias:${norm}`) ?? []
    if (globalMatches.length === 1) {
      const entry = globalMatches[0]
      return {
        codigo: entry.codigo,
        label: entry.nombre,
        confianza: "alias",
      }
    }
    return null
  }

  const lista = getMunicipioIndex().get(deptoCodigo) ?? []
  for (const entry of lista) {
    for (const alias of entry.aliases) {
      if (alias === norm) {
        return {
          codigo: entry.codigo,
          label: entry.nombre,
          confianza: "alias",
        }
      }
    }
    const entryNorm = normalizarTextoBusqueda(entry.nombre)
    if (entryNorm === norm) {
      return { codigo: entry.codigo, label: entry.nombre, confianza: "exact" }
    }
    if (entryNorm.includes(norm) || norm.includes(entryNorm)) {
      return { codigo: entry.codigo, label: entry.nombre, confianza: "fuzzy" }
    }
  }

  // Sin depto: buscar globalmente; ambiguo si hay multiples deptos
  const globalMatches = getMunicipioIndex().get(`alias:${norm}`) ?? []
  if (globalMatches.length === 1) {
    const entry = globalMatches[0]
    return {
      codigo: entry.codigo,
      label: entry.nombre,
      confianza: "alias",
    }
  }

  return null
}

export function resolverEspecialidad(texto: string): CodigoResuelto | null {
  return resolverDesdeIndice(texto, getEspIndex())
}

function getDespachoIndex(): Map<string, DespachoEntry> {
  if (despachoIndex) return despachoIndex
  despachoIndex = new Map()
  for (const entry of despachosData as DespachoEntry[]) {
    despachoIndex.set(`code:${entry.codDespachoCompleto}`, entry)
    for (const alias of entry.aliases) {
      despachoIndex.set(`alias:${alias}`, entry)
    }
    despachoIndex.set(`alias:${normalizarTextoBusqueda(entry.nombre)}`, entry)
  }
  return despachoIndex
}

/**
 * Resuelve un nombre/texto de juzgado o despacho a su codDespachoCompleto (12 dígitos).
 * Catálogo parcial (MVP): cubre principales ciudades y especialidades.
 * Si no se resuelve, retorna null y se usa el prefijo depto+ciudad (5 dígitos).
 */
export function resolverDespacho(texto: string): CodigoResuelto | null {
  const norm = normalizarTextoBusqueda(texto)
  if (!norm) return null

  const idx = getDespachoIndex()

  const byAlias = idx.get(`alias:${norm}`)
  if (byAlias) {
    return {
      codigo: byAlias.codDespachoCompleto,
      label: byAlias.nombre,
      confianza: "alias",
    }
  }

  // Busqueda fuzzy: el texto normalizado contiene el alias o viceversa
  for (const [key, entry] of idx.entries()) {
    if (key.startsWith("alias:")) {
      const alias = key.slice(6)
      if (alias.length >= 8 && (norm.includes(alias) || alias.includes(norm))) {
        return {
          codigo: entry.codDespachoCompleto,
          label: entry.nombre,
          confianza: "fuzzy",
        }
      }
    }
  }

  return null
}

export function normalizarEntidades(entidades: NlEntidades): EntidadesNormalizadas {
  const codigos: CodigosResueltos = {}
  const noResueltos: (keyof NlEntidades)[] = []

  if (entidades.depto) {
    const res = resolverDepto(entidades.depto)
    if (res) codigos.depto = res
    else noResueltos.push("depto")
  }

  if (entidades.ciudad) {
    const deptoCodigo = codigos.depto?.codigo
    const res = deptoCodigo
      ? resolverCiudad(deptoCodigo, entidades.ciudad)
      : resolverCiudad("", entidades.ciudad)
    if (res) {
      codigos.ciudad = res
      if (!codigos.depto && entidades.ciudad) {
        const munMatches =
          getMunicipioIndex().get(
            `alias:${normalizarTextoBusqueda(entidades.ciudad)}`
          ) ?? []
        if (munMatches.length === 1) {
          const deptoEntry = getDeptoIndex().get(munMatches[0].depto)
          if (deptoEntry) {
            codigos.depto = {
              codigo: deptoEntry.codigo,
              label: deptoEntry.nombre,
              confianza: "alias",
            }
          }
        }
      }
    } else {
      noResueltos.push("ciudad")
    }
  }

  if (entidades.especialidad) {
    const res = resolverEspecialidad(entidades.especialidad)
    if (res) codigos.especialidad = res
    else noResueltos.push("especialidad")
  }

  if (entidades.despacho) {
    const res = resolverDespacho(entidades.despacho)
    if (res) {
      codigos.despacho = res
      // Inferir depto y ciudad desde el despacho si no fueron extraidos
      if (!codigos.depto || !codigos.ciudad) {
        const entry = (despachosData as DespachoEntry[]).find(
          (d) => d.codDespachoCompleto === res.codigo
        )
        if (entry) {
          if (!codigos.depto) {
            const deptoEntry = getDeptoIndex().get(entry.depto)
            if (deptoEntry) {
              codigos.depto = { codigo: deptoEntry.codigo, label: deptoEntry.nombre, confianza: "alias" }
            }
          }
          if (!codigos.ciudad) {
            const munList = getMunicipioIndex().get(entry.depto) ?? []
            const munEntry = munList.find((m) => m.codigo === entry.ciudad)
            if (munEntry) {
              codigos.ciudad = { codigo: munEntry.codigo, label: munEntry.nombre, confianza: "alias" }
            }
          }
        }
      }
    } else {
      noResueltos.push("despacho")
    }
  }

  return { entidades, codigos, noResueltos }
}

/**
 * Prefijo de filtro CPNU porNombre.
 *
 * Cuando el NL menciona un juzgado/despacho especifico y se resuelve a un
 * codDespachoCompleto (12 dígitos), se usa el codigo completo para mayor precision.
 *
 * Cuando solo hay depto+ciudad (5 dígitos) se usa ese prefijo.
 * Spike 2026-05-31: 05001 y 050013109001 (12 dígitos) funcionan en porNombre;
 * 0500160 (7 dígitos con especialidad) falla.
 */
export function buildCodificacionDespacho(codigos: CodigosResueltos): string | null {
  const { despacho, depto, ciudad } = codigos
  if (despacho) return despacho.codigo   // 12 dígitos: codDespachoCompleto
  if (depto && ciudad) return `${depto.codigo}${ciudad.codigo}`  // 5 dígitos
  return null
}

/**
 * Construye radicado con wildcards. CPNU no acepta busqueda parcial por
 * NumeroRadicacion (spike 2026-05-31); reservado para tests/futuro.
 */
export function buildRadicadoWildcard(
  codigos: CodigosResueltos,
  anio?: number
): string | null {
  const { depto, ciudad, especialidad } = codigos
  if (!depto || !ciudad || !especialidad) return null

  const anioStr = anio ? String(anio) : "0000"

  try {
    return buildRadicado({
      depto: depto.codigo,
      ciudad: ciudad.codigo,
      especialidad: especialidad.codigo,
      entidad: "000",
      despacho: "00",
      anio: anioStr.padStart(4, "0").slice(-4),
      consecutivo: "00000",
      recurso: "00",
    })
  } catch {
    return null
  }
}

export function listDepartamentos(): CatalogoEntry[] {
  return departamentosData as CatalogoEntry[]
}

export function countMunicipios(): number {
  return (municipiosData as MunicipioEntry[]).length
}
