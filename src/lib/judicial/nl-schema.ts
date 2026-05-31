import { z } from "zod"
import {
  cpnuNombreInput,
  cpnuTipoPersonaInput,
} from "./cpnu-input.schemas"
import { judicialRadicadoSchema } from "./model"

const optionalNullish = <T extends z.ZodType>(schema: T) =>
  schema.nullish().transform((value) => value ?? undefined)

const nlUbicacionInput = z.string().trim().min(2).max(50)

export const nlEntidadesSchema = z.object({
  radicado: optionalNullish(judicialRadicadoSchema).optional(),
  nombre: optionalNullish(cpnuNombreInput).optional(),
  tipoPersona: optionalNullish(cpnuTipoPersonaInput).optional(),
  depto: optionalNullish(nlUbicacionInput).optional(),
  ciudad: optionalNullish(nlUbicacionInput).optional(),
  especialidad: optionalNullish(nlUbicacionInput).optional(),
  anio: optionalNullish(z.number().int().min(1900).max(2100)).optional(),
  despacho: optionalNullish(z.string().trim().min(3).max(120)).optional(),
})

export type NlEntidades = z.infer<typeof nlEntidadesSchema>

export class NlSchemaError extends Error {
  readonly cause?: z.ZodError

  constructor(message: string, cause?: z.ZodError) {
    super(message)
    this.name = "NlSchemaError"
    this.cause = cause
  }

  static isNlSchemaError(error: unknown): error is NlSchemaError {
    return error instanceof NlSchemaError
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

export function safeParseNlEntidades(data: unknown) {
  return nlEntidadesSchema.safeParse(data)
}

export function parseNlEntidades(data: unknown): NlEntidades {
  const result = safeParseNlEntidades(data)

  if (!result.success) {
    throw new NlSchemaError(
      `Entidades NL invalidas: ${formatZodError(result.error)}`,
      result.error
    )
  }

  return result.data
}

// ─── Tipos compartidos de extraccion NL ──────────────────────────────────────
// Definidos aqui (no en nl-extractor.ts, que es server-only) para que
// actions.types.ts pueda importarlos sin contaminar el bundle del cliente.

export type ConfianzaMap = Partial<Record<keyof NlEntidades, number>>

export type NlExtractionResult = {
  entidades: NlEntidades
  confianza: ConfianzaMap
  textoOriginal: string
}
