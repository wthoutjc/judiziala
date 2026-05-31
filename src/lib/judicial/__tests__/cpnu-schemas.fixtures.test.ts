import { describe, expect, it } from "vitest"
import {
  parseActuacionesResponse,
  parseConsultaResponse,
  parseDetalleResponse,
} from "../cpnu.schemas"
import {
  CPNU_TEST_ID_PROCESO,
  CPNU_TEST_RADICADO,
  loadFixture,
} from "./helpers/fixtures"

describe("CPNU schemas con fixtures reales", () => {
  it("parsea consulta-radicado.json", () => {
    const data = parseConsultaResponse(loadFixture("consulta-radicado.json"))

    expect(data.procesos).toHaveLength(1)
    expect(data.procesos[0].llaveProceso).toBe(CPNU_TEST_RADICADO)
  })

  it("parsea consulta-nombre.json", () => {
    const data = parseConsultaResponse(loadFixture("consulta-nombre.json"))

    expect(data.procesos[0].idProceso).toBe(CPNU_TEST_ID_PROCESO)
  })

  it("parsea detalle-proceso.json", () => {
    const data = parseDetalleResponse(loadFixture("detalle-proceso.json"))

    expect(data.llaveProceso).toBe(CPNU_TEST_RADICADO)
  })

  it("parsea actuaciones-proceso.json", () => {
    const data = parseActuacionesResponse(loadFixture("actuaciones-proceso.json"))

    expect(data.actuaciones.length).toBeGreaterThanOrEqual(13)
    expect(typeof data.actuaciones[0].conDocumentos).toBe("boolean")
  })

  it("parsea consulta con fechaProceso null como devuelve CPNU", () => {
    const data = parseConsultaResponse(loadFixture("consulta-nombre-null-fecha.json"))

    expect(data.procesos).toHaveLength(2)
    expect(data.procesos[0].fechaProceso).toBe("2020-12-21T00:00:00")
    expect(data.procesos[1].fechaProceso).toBeNull()
    expect(data.procesos[1].fechaUltimaActuacion).toBe("2024-06-10T00:00:00")
  })
})
