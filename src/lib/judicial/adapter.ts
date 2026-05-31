import type { CpnuActuacion, CpnuProceso, DetalleResponse } from "./cpnu.schemas"
import {
  type Actuacion,
  type EstadoActuacion,
  type EstadoProceso,
  type Proceso,
  type RolSujeto,
  type Sujeto,
  parseActuacion,
  parseProceso,
  parseSujeto,
} from "./model"

const SUJETOS_SEPARATOR = " | "
const ROL_NOMBRE_SEPARATOR = ": "

export function trimCpnuText(value: string | undefined | null): string | undefined {
  if (value == null) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "")
}

export function normalizeRolSujeto(label: string): RolSujeto {
  const normalized = stripAccents(label).toLowerCase().trim()

  if (normalized.startsWith("demandante")) return "demandante"
  if (normalized.startsWith("demandado")) return "demandado"
  if (normalized.startsWith("fiscalia") || normalized.startsWith("fiscal")) return "fiscalia"
  if (normalized.includes("apoderado") && normalized.includes("victima")) {
    return "apoderado_victima"
  }
  if (normalized.includes("numero interno")) return "numero_interno"
  if (normalized.includes("defensor")) return "defensor"
  if (normalized.startsWith("otro")) return "otro"

  return "otro"
}

export function parseSujetosProcesales(sujetosProcesales: string): Sujeto[] {
  const raw = sujetosProcesales.trim()
  if (!raw) return []

  return raw
    .split(SUJETOS_SEPARATOR)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const separatorIndex = segment.indexOf(ROL_NOMBRE_SEPARATOR)
      if (separatorIndex === -1) {
        return parseSujeto({
          rol: "otro",
          nombre: segment,
          raw: segment,
        })
      }

      const rolLabel = segment.slice(0, separatorIndex).trim()
      const nombre = segment.slice(separatorIndex + ROL_NOMBRE_SEPARATOR.length).trim()

      return parseSujeto({
        rol: normalizeRolSujeto(rolLabel),
        nombre: nombre || rolLabel,
        raw: segment,
      })
    })
}

export function deriveEstadoActuacion(
  actuacion: Pick<CpnuActuacion, "fechaActuacion">,
  isMostRecent: boolean,
  now: Date = new Date()
): EstadoActuacion {
  const fecha = new Date(actuacion.fechaActuacion)
  if (!Number.isNaN(fecha.getTime()) && fecha > now) return "pendiente"
  if (isMostRecent) return "actual"
  return "completado"
}

export function deriveEstadoProceso(input: {
  ubicacion?: string
  actuaciones?: CpnuActuacion[]
}): EstadoProceso {
  const ultima = input.actuaciones?.[0]
  const texto = [
    ultima?.actuacion,
    ultima?.anotacion,
    input.ubicacion,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (/suspend/.test(texto)) return "suspendido"
  if (/archiv/.test(texto)) return "archivado"
  if (/al despacho|en despacho|despacho por reparto/.test(texto)) return "en_despacho"
  if (/fija fecha audiencia|audiencia de preclusi|audiencia preliminar/.test(texto)) {
    return "urgente"
  }

  return "activo"
}

export type AdapterProcesoOptions = {
  id?: string
  alertas?: number
  actuaciones?: CpnuActuacion[]
}

export function cpnuProcesoToProceso(
  cpnu: CpnuProceso,
  detalle?: DetalleResponse,
  options: AdapterProcesoOptions = {}
): Proceso {
  const id = options.id ?? `cpnu-${cpnu.idProceso}`
  const actuaciones = options.actuaciones
    ? [...options.actuaciones].sort((a, b) => b.consActuacion - a.consActuacion)
    : undefined

  const procesoDraft = {
    id,
    cpnuIdProceso: cpnu.idProceso,
    cpnuIdConexion: cpnu.idConexion,
    radicado: cpnu.llaveProceso,
    despacho: trimCpnuText(cpnu.despacho) ?? cpnu.despacho,
    departamento: trimCpnuText(cpnu.departamento) ?? cpnu.departamento,
    ponente: trimCpnuText(detalle?.ponente),
    tipoProceso: trimCpnuText(detalle?.tipoProceso),
    claseProceso: trimCpnuText(detalle?.claseProceso),
    subclaseProceso: trimCpnuText(detalle?.subclaseProceso),
    recurso: trimCpnuText(detalle?.recurso),
    ubicacion: trimCpnuText(detalle?.ubicacion),
    esPrivado: cpnu.esPrivado,
    partes: parseSujetosProcesales(cpnu.sujetosProcesales),
    fechaRadicacion: cpnu.fechaProceso ?? cpnu.fechaUltimaActuacion ?? "",
    fechaUltimaActuacion: cpnu.fechaUltimaActuacion ?? cpnu.fechaProceso ?? "",
    ultimaActualizacion: detalle?.ultimaActualizacion,
    estado: deriveEstadoProceso({
      ubicacion: trimCpnuText(detalle?.ubicacion),
      actuaciones,
    }),
    alertas: options.alertas ?? 0,
  }

  return parseProceso(procesoDraft)
}

export function cpnuActuacionToActuacion(
  cpnu: CpnuActuacion,
  procesoId: string,
  isMostRecent: boolean,
  now: Date = new Date()
): Actuacion {
  return parseActuacion({
    id: String(cpnu.idRegActuacion),
    procesoId,
    consActuacion: cpnu.consActuacion,
    fecha: cpnu.fechaActuacion,
    tipo: trimCpnuText(cpnu.actuacion) ?? cpnu.actuacion,
    descripcion: cpnu.anotacion,
    fechaInicial: cpnu.fechaInicial,
    fechaFinal: cpnu.fechaFinal,
    fechaRegistro: cpnu.fechaRegistro,
    conDocumentos: cpnu.conDocumentos,
    estado: deriveEstadoActuacion(cpnu, isMostRecent, now),
  })
}

export function cpnuActuacionesToActuaciones(
  actuaciones: CpnuActuacion[],
  procesoId: string,
  now: Date = new Date()
): Actuacion[] {
  const sorted = [...actuaciones].sort((a, b) => b.consActuacion - a.consActuacion)

  return sorted.map((actuacion, index) =>
    cpnuActuacionToActuacion(actuacion, procesoId, index === 0, now)
  )
}

export function cpnuProcesoCompleto(
  cpnu: CpnuProceso,
  detalle: DetalleResponse,
  actuaciones: CpnuActuacion[],
  options: Omit<AdapterProcesoOptions, "actuaciones"> = {}
): { proceso: Proceso; actuaciones: Actuacion[] } {
  const sortedActuaciones = [...actuaciones].sort((a, b) => b.consActuacion - a.consActuacion)
  const id = options.id ?? `cpnu-${cpnu.idProceso}`
  const proceso = cpnuProcesoToProceso(cpnu, detalle, {
    ...options,
    id,
    actuaciones: sortedActuaciones,
  })

  return {
    proceso,
    actuaciones: cpnuActuacionesToActuaciones(sortedActuaciones, id),
  }
}
