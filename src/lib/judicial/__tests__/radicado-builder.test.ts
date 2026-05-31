import { describe, expect, it } from "vitest"
import { CPNU_TEST_RADICADO } from "./helpers/fixtures"
import {
  buildRadicado,
  parseRadicadoFormateado,
  RadicadoBuilderError,
  validarRadicado,
} from "../radicado-builder"

const SEGMENTOS = {
  depto: "05",
  ciudad: "001",
  especialidad: "60",
  entidad: "002",
  despacho: "06",
  anio: "2020",
  consecutivo: "18197",
  recurso: "00",
} as const

describe("radicado-builder", () => {
  it("buildRadicado concatena los 8 segmentos", () => {
    expect(buildRadicado(SEGMENTOS)).toBe(CPNU_TEST_RADICADO)
  })

  it("parseRadicadoFormateado acepta guiones y raw", () => {
    expect(parseRadicadoFormateado("05-001-60-002-06-2020-18197-00")).toBe(
      CPNU_TEST_RADICADO
    )
    expect(parseRadicadoFormateado(CPNU_TEST_RADICADO)).toBe(CPNU_TEST_RADICADO)
  })

  it("validarRadicado acepta solo 23 digitos", () => {
    expect(validarRadicado(CPNU_TEST_RADICADO)).toBe(true)
    expect(validarRadicado("123")).toBe(false)
    expect(validarRadicado(`${CPNU_TEST_RADICADO}0`)).toBe(false)
    expect(validarRadicado("05-001-60-002-06-2020-18197-00")).toBe(false)
  })

  it("buildRadicado rechaza segmento con longitud invalida", () => {
    expect(() =>
      buildRadicado({ ...SEGMENTOS, depto: "5" })
    ).toThrow(RadicadoBuilderError)
  })

  it("buildRadicado rechaza segmento no numerico", () => {
    expect(() =>
      buildRadicado({ ...SEGMENTOS, anio: "20AB" })
    ).toThrow(RadicadoBuilderError)
  })

  it("parseRadicadoFormateado rechaza digitos distintos de 23", () => {
    expect(() => parseRadicadoFormateado("123")).toThrow(RadicadoBuilderError)
    expect(() =>
      parseRadicadoFormateado("05-001-60-002-06-2020-18197")
    ).toThrow(RadicadoBuilderError)
  })
})
