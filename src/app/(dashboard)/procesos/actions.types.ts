import { z } from "zod"
import {
  cpnuIdProcesoInput,
  cpnuNombreInput,
  cpnuPaginaInput,
  cpnuTipoPersonaInput,
} from "@/lib/judicial/cpnu-input.schemas"
import { judicialRadicadoSchema, type Proceso } from "@/lib/judicial/model"
import type { ConfianzaMap, NlEntidades } from "@/lib/judicial/nl-schema"
import { nlEntidadesSchema } from "@/lib/judicial/nl-schema"
import type { CodigosResueltos } from "@/lib/judicial/catalogos"

export const consultarRadicadoInputSchema = z.object({
  radicado: judicialRadicadoSchema,
  soloActivos: z.boolean().optional().default(false),
  pagina: cpnuPaginaInput.optional().default(1),
})

export const consultarNombreInputSchema = z.object({
  nombre: cpnuNombreInput,
  tipoPersona: cpnuTipoPersonaInput,
  soloActivos: z.boolean().optional().default(false),
  pagina: cpnuPaginaInput.optional().default(1),
  codificacionDespacho: z.string().max(12).optional(),
})

export const monitorearInputSchema = z.object({
  cpnuIdProceso: cpnuIdProcesoInput,
})

export type ConsultarRadicadoInput = z.input<typeof consultarRadicadoInputSchema>
export type ConsultarNombreInput = z.input<typeof consultarNombreInputSchema>
export type MonitorearInput = z.input<typeof monitorearInputSchema>

export type PaginacionConsulta = {
  pagina: number
  cantidadPaginas: number
  cantidadRegistros: number
}

export type ConsultaProcesosSuccess = {
  ok: true
  procesos: Proceso[]
  paginacion: PaginacionConsulta | null
}

export type MonitorearSuccess = {
  ok: true
  procesoId: string
  radicado: string
}

export type ActionFailure = {
  ok: false
  error: string
  code?: string
}

export type ConsultaResult = ConsultaProcesosSuccess | ActionFailure
export type MonitorearResult = MonitorearSuccess | ActionFailure

// ─── Consulta NL ─────────────────────────────────────────────────────────────

export const interpretarNLInputSchema = z.object({
  texto: z.string().trim().min(5).max(500),
})

export type InterpretarNLInput = z.input<typeof interpretarNLInputSchema>

export type InterpretarNLSuccess = {
  ok: true
  entidades: NlEntidades
  confianza: ConfianzaMap
  codigos: CodigosResueltos
  noResueltos: (keyof NlEntidades)[]
}

export type InterpretarNLResult = InterpretarNLSuccess | ActionFailure

export const consultarNLInputSchema = z.object({
  entidades: nlEntidadesSchema,
  confianza: z.record(z.string(), z.number()).optional(),
  soloActivos: z.boolean().optional().default(false),
  pagina: cpnuPaginaInput.optional().default(1),
})

export type ConsultarNLInput = z.input<typeof consultarNLInputSchema>

export type ConsultarNLSuccess = {
  ok: true
  procesos: Proceso[]
  paginacion: PaginacionConsulta | null
  entidades: NlEntidades
  confianza: ConfianzaMap
  codigos: CodigosResueltos
}

export type ConsultarNLResult = ConsultarNLSuccess | ActionFailure

export type { CodigosResueltos }
