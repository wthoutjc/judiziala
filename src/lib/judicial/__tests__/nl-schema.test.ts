import { describe, expect, it } from "vitest"
import { CPNU_TEST_NOMBRE, CPNU_TEST_RADICADO } from "./helpers/fixtures"
import {
  NlSchemaError,
  parseNlEntidades,
  safeParseNlEntidades,
} from "../nl-schema"

describe("nl-schema", () => {
  it("acepta objeto vacio con todos los campos undefined", () => {
    const entidades = parseNlEntidades({})

    expect(entidades).toEqual({})
  })

  it("acepta extraccion parcial", () => {
    const entidades = parseNlEntidades({
      nombre: CPNU_TEST_NOMBRE,
      depto: "05",
      anio: 2022,
    })

    expect(entidades).toEqual({
      nombre: CPNU_TEST_NOMBRE,
      depto: "05",
      anio: 2022,
    })
  })

  it("acepta radicado valido de 23 digitos", () => {
    const entidades = parseNlEntidades({ radicado: CPNU_TEST_RADICADO })

    expect(entidades.radicado).toBe(CPNU_TEST_RADICADO)
  })

  it("rechaza radicado invalido", () => {
    expect(() => parseNlEntidades({ radicado: "123" })).toThrow(NlSchemaError)
    expect(safeParseNlEntidades({ radicado: "123" }).success).toBe(false)
  })

  it("rechaza tipoPersona invalido", () => {
    expect(() =>
      parseNlEntidades({ tipoPersona: "empresa" as never })
    ).toThrow(NlSchemaError)
  })

  it("rechaza anio fuera de rango", () => {
    expect(() => parseNlEntidades({ anio: 1800 })).toThrow(NlSchemaError)
  })

  it("normaliza null del LLM a undefined", () => {
    const entidades = parseNlEntidades({
      nombre: null,
      depto: "Antioquia",
      ciudad: null,
      anio: 2024,
    })

    expect(entidades).toEqual({
      depto: "Antioquia",
      anio: 2024,
    })
  })
})
