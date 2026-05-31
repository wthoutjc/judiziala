import { describe, expect, it } from "vitest"
import {
  cpnuActuacionesToActuaciones,
  cpnuProcesoToProceso,
  normalizeRolSujeto,
  parseSujetosProcesales,
} from "../adapter"
import { parseActuacionesResponse, parseConsultaResponse } from "../cpnu.schemas"
import { findSujetoPorRol } from "../model"
import {
  ADAPTER_FIXTURE_CASES,
  expectAdapterRoundTrip,
  loadAdapterFixtureCase,
  mapAdapterFixtureCase,
} from "./helpers/adapter-roundtrip"
import {
  CPNU_TEST_ID_PROCESO,
  CPNU_TEST_RADICADO,
  loadFixture,
} from "./helpers/fixtures"

describe("adapter CPNU -> modelo", () => {
  it.each(ADAPTER_FIXTURE_CASES)(
    "round-trip sin perdida ($slug)",
    (testCase) => {
      expectAdapterRoundTrip(testCase)
    }
  )

  it("consulta por nombre mapea igual que por radicado", () => {
    const radicado = parseConsultaResponse(loadFixture("consulta-radicado.json")).procesos[0]
    const nombre = parseConsultaResponse(loadFixture("consulta-nombre.json")).procesos[0]

    const fromRadicado = cpnuProcesoToProceso(radicado)
    const fromNombre = cpnuProcesoToProceso(nombre)

    expect(fromNombre.radicado).toBe(fromRadicado.radicado)
    expect(fromNombre.cpnuIdProceso).toBe(fromRadicado.cpnuIdProceso)
    expect(fromNombre.partes).toEqual(fromRadicado.partes)
  })

  it("parsea sujetosProcesales del fixture penal", () => {
    const { cpnuProceso } = mapAdapterFixtureCase(ADAPTER_FIXTURE_CASES[0])
    const partes = parseSujetosProcesales(cpnuProceso.sujetosProcesales)

    expect(partes).toHaveLength(8)
    expect(findSujetoPorRol(partes, "demandado")?.nombre).toContain("EDIBER CEFERINO RINCON")
    expect(normalizeRolSujeto("Apoderado de la Victima")).toBe("apoderado_victima")
  })

  it("ordena actuaciones por consActuacion descendente", () => {
    const { actuacionesCpnu } = loadAdapterFixtureCase(ADAPTER_FIXTURE_CASES[0])
    const shuffled = [...actuacionesCpnu].reverse()
    const actuaciones = cpnuActuacionesToActuaciones(shuffled, "test-proceso-1")

    expect(actuaciones[0].consActuacion).toBe(
      Math.max(...actuacionesCpnu.map((item) => item.consActuacion))
    )
    expect(actuaciones.at(-1)?.consActuacion).toBe(
      Math.min(...actuacionesCpnu.map((item) => item.consActuacion))
    )
  })
})

describe("adapter identidad CPNU", () => {
  it("conserva radicado e idProceso en los 3 fixtures", () => {
    for (const testCase of ADAPTER_FIXTURE_CASES) {
      const { cpnuProceso, proceso } = mapAdapterFixtureCase(testCase)

      expect(proceso.radicado).toBe(cpnuProceso.llaveProceso)
      expect(proceso.cpnuIdProceso).toBe(cpnuProceso.idProceso)
      expect(proceso.radicado).toMatch(/^\d{23}$/)
    }
  })

  it("fixture penal mantiene ids de referencia", () => {
    const { proceso } = mapAdapterFixtureCase(ADAPTER_FIXTURE_CASES[0])

    expect(proceso.cpnuIdProceso).toBe(CPNU_TEST_ID_PROCESO)
    expect(proceso.radicado).toBe(CPNU_TEST_RADICADO)
  })
})
