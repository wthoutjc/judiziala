import { describe, expect, it } from "vitest"
import { CPNU_TEST_NOMBRE, CPNU_TEST_RADICADO } from "./helpers/fixtures"
import {
  buildCodificacionDespacho,
  buildRadicadoWildcard,
  countMunicipios,
  listDepartamentos,
  normalizarEntidades,
  normalizarTextoBusqueda,
  resolverCiudad,
  resolverDepto,
  resolverDespacho,
  resolverEspecialidad,
} from "../catalogos"

describe("catalogos", () => {
  it("normaliza texto sin tildes", () => {
    expect(normalizarTextoBusqueda("  Medellín  ")).toBe("medellin")
  })

  it("resuelve departamento Antioquia", () => {
    const res = resolverDepto("Antioquia")
    expect(res?.codigo).toBe("05")
  })

  it("resuelve Medellin en Antioquia", () => {
    const res = resolverCiudad("05", "Medellin")
    expect(res?.codigo).toBe("001")
    expect(res?.label).toBe("Medellín")
  })

  it("resuelve Medellin sin depto cuando es unico", () => {
    const res = resolverCiudad("", "Medellin")
    expect(res?.codigo).toBe("001")
  })

  it("resuelve especialidad penal", () => {
    const res = resolverEspecialidad("penales")
    expect(res?.codigo).toBe("60")
  })

  it("normalizarEntidades resuelve ubicacion y especialidad", () => {
    const norm = normalizarEntidades({
      nombre: CPNU_TEST_NOMBRE,
      depto: "Antioquia",
      ciudad: "Medellin",
      especialidad: "penal",
      anio: 2020,
    })

    expect(norm.codigos.depto?.codigo).toBe("05")
    expect(norm.codigos.ciudad?.codigo).toBe("001")
    expect(norm.codigos.especialidad?.codigo).toBe("60")
    expect(norm.noResueltos).toEqual([])
  })

  it("buildCodificacionDespacho usa depto + ciudad", () => {
    const norm = normalizarEntidades({
      depto: "Antioquia",
      ciudad: "Medellin",
    })
    expect(buildCodificacionDespacho(norm.codigos)).toBe("05001")
  })

  it("resolverDespacho resuelve juzgado penal Medellin a 12 digitos", () => {
    const res = resolverDespacho("Juzgado 1 Penal de Conocimiento de Medellin")
    expect(res?.codigo).toBe("050013109001")
  })

  it("buildCodificacionDespacho prioriza despacho de 12 digitos sobre depto+ciudad", () => {
    const norm = normalizarEntidades({
      depto: "Antioquia",
      ciudad: "Medellin",
      despacho: "Juzgado 1 Penal de Conocimiento de Medellin",
    })
    expect(buildCodificacionDespacho(norm.codigos)).toBe("050013109001")
    expect(buildCodificacionDespacho(norm.codigos)).not.toBe("05001")
  })

  it("normalizarEntidades infiere depto y ciudad desde despacho", () => {
    const norm = normalizarEntidades({
      despacho: "Juzgado 1 Penal de Conocimiento de Medellin",
    })
    expect(norm.codigos.despacho?.codigo).toBe("050013109001")
    expect(norm.codigos.depto?.codigo).toBe("05")
    expect(norm.codigos.ciudad?.codigo).toBe("001")
  })

  it("buildRadicadoWildcard produce 23 digitos", () => {
    const norm = normalizarEntidades({
      depto: "Antioquia",
      ciudad: "Medellin",
      especialidad: "penal",
    })
    const rad = buildRadicadoWildcard(norm.codigos, 2020)
    expect(rad).toHaveLength(23)
    expect(rad).toMatch(/^0500160/)
  })

  it("incluye catalogo DANE completo", () => {
    expect(listDepartamentos().length).toBeGreaterThanOrEqual(33)
    expect(countMunicipios()).toBeGreaterThan(1000)
  })

  it("marca entidades no resueltas", () => {
    const norm = normalizarEntidades({
      depto: "Departamento Inventado XYZ",
      especialidad: "xyz especialidad",
    })
    expect(norm.noResueltos).toContain("depto")
    expect(norm.noResueltos).toContain("especialidad")
  })
})
