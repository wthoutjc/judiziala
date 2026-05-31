import { describe, expect, it } from "vitest"
import {
  CPNU_TEST_ID_PROCESO,
  CPNU_TEST_NOMBRE,
  CPNU_TEST_NOMBRE_NULL_FECHA,
  CPNU_TEST_RADICADO,
} from "./helpers/fixtures"
import { createLiveClient } from "./helpers/test-client"

describe.sequential("CpnuClient integracion live CPNU", () => {
  const client = createLiveClient()

  it("detalle retorna el radicado esperado", async () => {
    const data = await client.detalle(CPNU_TEST_ID_PROCESO)

    expect(data.llaveProceso).toBe(CPNU_TEST_RADICADO)
  })

  it("porRadicado retorna idProceso esperado", async () => {
    const data = await client.porRadicado(CPNU_TEST_RADICADO)

    expect(data.procesos).toHaveLength(1)
    expect(data.procesos[0].idProceso).toBe(CPNU_TEST_ID_PROCESO)
  })

  it("porNombre incluye el proceso del radicado de prueba", async () => {
    const data = await client.porNombre(CPNU_TEST_NOMBRE, "nat")

    expect(
      data.procesos.some((p) => p.llaveProceso === CPNU_TEST_RADICADO)
    ).toBe(true)
  })

  it("actuaciones retorna timeline con paginacion", async () => {
    const data = await client.actuaciones(CPNU_TEST_ID_PROCESO, { pagina: 1 })

    expect(data.actuaciones.length).toBeGreaterThan(0)
    expect(data.paginacion.pagina).toBe(1)
  })

  it("porNombre con fechaProceso null no falla validacion (Sebastian Lopez Gomez)", async () => {
    const data = await client.porNombre(CPNU_TEST_NOMBRE_NULL_FECHA, "nat", {
      soloActivos: true,
    })

    expect(data.procesos.length).toBeGreaterThan(0)
    expect(
      data.procesos.some((p) => p.fechaProceso === null && p.fechaUltimaActuacion)
    ).toBe(true)
  })

  it("mantiene consistencia entre porRadicado y detalle", async () => {
    const consulta = await client.porRadicado(CPNU_TEST_RADICADO)
    const detalle = await client.detalle(CPNU_TEST_ID_PROCESO)

    expect(consulta.procesos[0].llaveProceso).toBe(detalle.llaveProceso)
  })
})
