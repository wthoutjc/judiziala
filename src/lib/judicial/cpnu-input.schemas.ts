import { z } from "zod"

export const cpnuRadicadoInput = z.string().regex(/^\d{23}$/)
export const cpnuTipoPersonaInput = z.enum(["nat", "jur"])
export const cpnuIdProcesoInput = z.number().int().positive()
export const cpnuNombreInput = z.string().trim().min(3)
export const cpnuPaginaInput = z.number().int().positive().default(1)
