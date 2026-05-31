import { z } from "zod"

export const judicialRadicadoSchema = z.string().regex(/^\d{23}$/)
export const judicialIsoDateSchema = z.string().min(1)

export const rolSujetoSchema = z.enum([
  "demandante",
  "demandado",
  "fiscalia",
  "defensor",
  "apoderado_victima",
  "numero_interno",
  "otro",
])

export const sujetoSchema = z.object({
  rol: rolSujetoSchema,
  nombre: z.string().min(1),
  raw: z.string(),
})

export const estadoProcesoSchema = z.enum([
  "activo",
  "en_despacho",
  "urgente",
  "suspendido",
  "archivado",
])

export const procesoSchema = z.object({
  id: z.string().min(1),
  cpnuIdProceso: z.number().int().positive(),
  cpnuIdConexion: z.number().int(),
  radicado: judicialRadicadoSchema,
  despacho: z.string(),
  departamento: z.string(),
  ponente: z.string().optional(),
  tipoProceso: z.string().optional(),
  claseProceso: z.string().optional(),
  subclaseProceso: z.string().optional(),
  recurso: z.string().optional(),
  ubicacion: z.string().optional(),
  esPrivado: z.boolean(),
  partes: z.array(sujetoSchema),
  fechaRadicacion: judicialIsoDateSchema,
  fechaUltimaActuacion: judicialIsoDateSchema,
  ultimaActualizacion: judicialIsoDateSchema.optional(),
  estado: estadoProcesoSchema,
  alertas: z.number().int().nonnegative(),
})

export const estadoActuacionSchema = z.enum(["completado", "actual", "pendiente"])

export const actuacionSchema = z.object({
  id: z.string().min(1),
  procesoId: z.string().min(1),
  consActuacion: z.number().int(),
  fecha: judicialIsoDateSchema,
  tipo: z.string(),
  descripcion: z.string().nullable(),
  fechaInicial: judicialIsoDateSchema.nullable().optional(),
  fechaFinal: judicialIsoDateSchema.nullable().optional(),
  fechaRegistro: judicialIsoDateSchema,
  conDocumentos: z.boolean(),
  estado: estadoActuacionSchema,
})

export const monitoreoProcesoSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  procesoId: z.string().min(1),
  createdAt: judicialIsoDateSchema,
})

export const alertaTipoSchema = z.enum(["urgente", "info", "advertencia"])

export const alertaSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  procesoId: z.string().min(1),
  radicado: judicialRadicadoSchema,
  tipo: alertaTipoSchema,
  titulo: z.string().min(1),
  descripcion: z.string(),
  actuacionId: z.string().optional(),
  leida: z.boolean(),
  createdAt: judicialIsoDateSchema,
})

export const procesoEnCarteraSchema = procesoSchema.extend({
  monitoreoId: z.string().min(1),
  monitoreadoDesde: judicialIsoDateSchema,
})

export type RolSujeto = z.infer<typeof rolSujetoSchema>
export type Sujeto = z.infer<typeof sujetoSchema>
export type EstadoProceso = z.infer<typeof estadoProcesoSchema>
export type Proceso = z.infer<typeof procesoSchema>
export type EstadoActuacion = z.infer<typeof estadoActuacionSchema>
export type Actuacion = z.infer<typeof actuacionSchema>
export type MonitoreoProceso = z.infer<typeof monitoreoProcesoSchema>
export type AlertaTipo = z.infer<typeof alertaTipoSchema>
export type Alerta = z.infer<typeof alertaSchema>
export type ProcesoEnCartera = z.infer<typeof procesoEnCarteraSchema>

export class JudicialModelError extends Error {
  readonly cause?: z.ZodError

  constructor(message: string, cause?: z.ZodError) {
    super(message)
    this.name = "JudicialModelError"
    this.cause = cause
  }

  static isJudicialModelError(error: unknown): error is JudicialModelError {
    return error instanceof JudicialModelError
  }
}

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
    throw new JudicialModelError(
      `Modelo ${label} invalido: ${formatZodError(result.error)}`,
      result.error
    )
  }
  return result.data
}

export function parseSujeto(data: unknown): Sujeto {
  return parseWithSchema(sujetoSchema, data, "Sujeto")
}

export function parseProceso(data: unknown): Proceso {
  return parseWithSchema(procesoSchema, data, "Proceso")
}

export function parseActuacion(data: unknown): Actuacion {
  return parseWithSchema(actuacionSchema, data, "Actuacion")
}

export function parseMonitoreoProceso(data: unknown): MonitoreoProceso {
  return parseWithSchema(monitoreoProcesoSchema, data, "MonitoreoProceso")
}

export function parseAlerta(data: unknown): Alerta {
  return parseWithSchema(alertaSchema, data, "Alerta")
}

export function parseProcesoEnCartera(data: unknown): ProcesoEnCartera {
  return parseWithSchema(procesoEnCarteraSchema, data, "ProcesoEnCartera")
}

export function deriveJurisdiccion(
  proceso: Pick<Proceso, "tipoProceso" | "claseProceso" | "subclaseProceso">
): string {
  const parts = [proceso.claseProceso, proceso.tipoProceso, proceso.subclaseProceso].filter(
    Boolean
  )
  return parts.join(" — ") || "Sin clasificacion"
}

export function findSujetoPorRol(partes: Sujeto[], rol: RolSujeto): Sujeto | undefined {
  return partes.find((parte) => parte.rol === rol)
}

const ROL_SUJETO_LABELS: Record<RolSujeto, string> = {
  demandante: "Demandante",
  demandado: "Demandado",
  fiscalia: "Fiscalia",
  defensor: "Defensor",
  apoderado_victima: "Apoderado de la victima",
  numero_interno: "Numero interno",
  otro: "Otro",
}

export type SujetoDisplay = {
  rol: RolSujeto
  rolLabel: string
  nombre: string
}

export function labelRolSujeto(rol: RolSujeto): string {
  return ROL_SUJETO_LABELS[rol]
}

export function listSujetosDisplay(partes: Sujeto[]): SujetoDisplay[] {
  return partes.map((parte) => ({
    rol: parte.rol,
    rolLabel: labelRolSujeto(parte.rol),
    nombre: parte.nombre,
  }))
}
