// Radicado-builder — deterministic, no network, no LLM.
// Construye y valida radicados de 23 digitos a partir de sus 8 segmentos.
//
// Segmentacion (coincide con display.ts::formatearRadicado):
//   DD  (2) — codigo departamento
//   CCC (3) — codigo ciudad/municipio
//   EE  (2) — especialidad judicial
//   ESS (3) — entidad/sala
//   DD  (2) — numero de despacho
//  AAAA (4) — anio de radicacion
// CCCCC (5) — consecutivo
//   RR  (2) — recurso
// Total: 2+3+2+3+2+4+5+2 = 23

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type RadicadoSegmentos = {
  depto: string       // 2 digitos
  ciudad: string      // 3 digitos
  especialidad: string // 2 digitos
  entidad: string     // 3 digitos
  despacho: string    // 2 digitos
  anio: string        // 4 digitos
  consecutivo: string // 5 digitos
  recurso: string     // 2 digitos
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class RadicadoBuilderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RadicadoBuilderError"
  }

  static isRadicadoBuilderError(error: unknown): error is RadicadoBuilderError {
    return error instanceof RadicadoBuilderError
  }
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SEGMENT_LENGTHS: Record<keyof RadicadoSegmentos, number> = {
  depto: 2,
  ciudad: 3,
  especialidad: 2,
  entidad: 3,
  despacho: 2,
  anio: 4,
  consecutivo: 5,
  recurso: 2,
}

const DIGIT_ONLY = /^\d+$/

// ─── buildRadicado ────────────────────────────────────────────────────────────

/**
 * Construye un radicado de 23 digitos a partir de sus 8 segmentos.
 * Lanza RadicadoBuilderError si algun segmento no cumple la longitud exacta
 * o contiene caracteres no numericos.
 *
 * @example
 * buildRadicado({
 *   depto: "05", ciudad: "001", especialidad: "60", entidad: "002",
 *   despacho: "06", anio: "2020", consecutivo: "18197", recurso: "00",
 * })
 * // => "05001600020620201819700"
 */
export function buildRadicado(segments: RadicadoSegmentos): string {
  for (const [key, expectedLength] of Object.entries(SEGMENT_LENGTHS) as [
    keyof RadicadoSegmentos,
    number,
  ][]) {
    const value = segments[key]

    if (!DIGIT_ONLY.test(value) || value.length !== expectedLength) {
      throw new RadicadoBuilderError(
        `Segmento "${key}" invalido: se esperan ${expectedLength} digitos numericos, ` +
          `se recibio "${value}" (${value.length} caracteres)`
      )
    }
  }

  return (Object.keys(SEGMENT_LENGTHS) as (keyof RadicadoSegmentos)[])
    .map((k) => segments[k])
    .join("")
}

// ─── parseRadicadoFormateado ──────────────────────────────────────────────────

/**
 * Convierte un radicado formateado con guiones al string de 23 digitos raw.
 * Lanza RadicadoBuilderError si el resultado no tiene exactamente 23 digitos.
 *
 * @example
 * parseRadicadoFormateado("05-001-60-002-06-2020-18197-00")
 * // => "05001600020620201819700"
 *
 * parseRadicadoFormateado("05001600020620201819700") // sin guiones — tambien funciona
 * // => "05001600020620201819700"
 */
export function parseRadicadoFormateado(formatted: string): string {
  const digits = formatted.replace(/\D/g, "")

  if (digits.length !== 23) {
    throw new RadicadoBuilderError(
      `Radicado formateado invalido: se obtuvieron ${digits.length} digitos ` +
        `(se esperan 23) a partir de "${formatted}"`
    )
  }

  return digits
}

// ─── validarRadicado ──────────────────────────────────────────────────────────

/**
 * Devuelve true si el string es un radicado de exactamente 23 digitos numericos.
 */
export function validarRadicado(raw: string): boolean {
  return DIGIT_ONLY.test(raw) && raw.length === 23
}
