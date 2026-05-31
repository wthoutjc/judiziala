import { z } from "zod"
import { CpnuError } from "./cpnu-error"

const cpnuIsoDate = z.string()
const cpnuRadicado = z.string().regex(/^\d{23}$/)

export const cpnuProcesoSchema = z
  .object({
    idProceso: z.number().int().positive(),
    idConexion: z.number().int(),
    llaveProceso: cpnuRadicado,
    fechaProceso: cpnuIsoDate,
    fechaUltimaActuacion: cpnuIsoDate,
    despacho: z.string(),
    departamento: z.string(),
    sujetosProcesales: z.string(),
    esPrivado: z.boolean(),
    cantFilas: z.number().int(),
  })
  .passthrough()

export const cpnuPaginacionSchema = z
  .object({
    cantidadRegistros: z.number().int().nonnegative(),
    registrosPagina: z.number().int().positive(),
    cantidadPaginas: z.number().int().nonnegative(),
    pagina: z.number().int().positive(),
    paginas: z.number().int().positive().nullable(),
  })
  .passthrough()

export const cpnuConsultaParametrosSchema = z
  .object({
    numero: cpnuRadicado.nullable(),
    nombre: z.string().nullable(),
    tipoPersona: z.enum(["nat", "jur"]).nullable(),
    idSujeto: z.number().int().nullable(),
    ponente: z.string().nullable(),
    claseProceso: z.string().nullable(),
    codificacionDespacho: z.string().nullable(),
    soloActivos: z.boolean(),
  })
  .passthrough()

export const cpnuActuacionSchema = z
  .object({
    idRegActuacion: z.number().int(),
    llaveProceso: cpnuRadicado,
    consActuacion: z.number().int(),
    fechaActuacion: cpnuIsoDate,
    actuacion: z.string(),
    anotacion: z.string().nullable(),
    fechaInicial: cpnuIsoDate.nullable(),
    fechaFinal: cpnuIsoDate.nullable(),
    fechaRegistro: cpnuIsoDate,
    codRegla: z.string(),
    conDocumentos: z.boolean(),
    cant: z.number().int(),
  })
  .passthrough()

export const consultaResponseSchema = z
  .object({
    tipoConsulta: z.string(),
    procesos: z.array(cpnuProcesoSchema),
    parametros: cpnuConsultaParametrosSchema,
    paginacion: cpnuPaginacionSchema.optional(),
  })
  .passthrough()

// CPNU devuelve idRegProceso (7 dígitos), distinto de idProceso en consultas.
export const detalleResponseSchema = z
  .object({
    idRegProceso: z.number().int().positive(),
    llaveProceso: cpnuRadicado,
    idConexion: z.number().int(),
    esPrivado: z.boolean(),
    fechaProceso: cpnuIsoDate,
    codDespachoCompleto: z.string(),
    despacho: z.string(),
    ponente: z.string(),
    tipoProceso: z.string(),
    claseProceso: z.string(),
    subclaseProceso: z.string(),
    recurso: z.string(),
    ubicacion: z.string(),
    contenidoRadicacion: z.string().nullable(),
    fechaConsulta: cpnuIsoDate,
    ultimaActualizacion: cpnuIsoDate,
  })
  .passthrough()

export const actuacionesResponseSchema = z
  .object({
    actuaciones: z.array(cpnuActuacionSchema),
    paginacion: cpnuPaginacionSchema,
  })
  .passthrough()

export type CpnuProceso = z.infer<typeof cpnuProcesoSchema>
export type CpnuPaginacion = z.infer<typeof cpnuPaginacionSchema>
export type CpnuActuacion = z.infer<typeof cpnuActuacionSchema>
export type ConsultaResponse = z.infer<typeof consultaResponseSchema>
export type DetalleResponse = z.infer<typeof detalleResponseSchema>
export type ActuacionesResponse = z.infer<typeof actuacionesResponseSchema>

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root"
      return `${path}: ${issue.message}`
    })
    .join("; ")
}

function parseWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
  label: string
): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw CpnuError.fromZod(
      `CPNU ${label} invalida: ${formatZodError(result.error)}`,
      result.error
    )
  }
  return result.data
}

export function parseConsultaResponse(data: unknown): ConsultaResponse {
  return parseWithSchema(consultaResponseSchema, data, "ConsultaResponse")
}

export function parseDetalleResponse(data: unknown): DetalleResponse {
  return parseWithSchema(detalleResponseSchema, data, "DetalleResponse")
}

export function parseActuacionesResponse(data: unknown): ActuacionesResponse {
  return parseWithSchema(actuacionesResponseSchema, data, "ActuacionesResponse")
}
