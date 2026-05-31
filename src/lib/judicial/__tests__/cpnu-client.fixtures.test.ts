import { describe, expect, it } from "vitest"
import { CpnuError } from "../cpnu-error"
import {
  CPNU_TEST_ID_PROCESO,
  CPNU_TEST_NOMBRE,
  CPNU_TEST_RADICADO,
} from "./helpers/fixtures"
import { createFixtureClient } from "./helpers/test-client"

describe("CpnuClient con fixtures reales", () => {
  const client = createFixtureClient()

  it("porRadicado retorna el proceso del fixture", async () => {
    const data = await client.porRadicado(CPNU_TEST_RADICADO)

    expect(data.procesos).toHaveLength(1)
    expect(data.procesos[0].llaveProceso).toBe(CPNU_TEST_RADICADO)
  })

  it("porNombre retorna el proceso esperado", async () => {
    const data = await client.porNombre(CPNU_TEST_NOMBRE, "nat")

    expect(data.procesos.some((p) => p.idProceso === CPNU_TEST_ID_PROCESO)).toBe(
      true
    )
  })

  it("detalle retorna claseProceso del fixture", async () => {
    const data = await client.detalle(CPNU_TEST_ID_PROCESO)

    expect(data.claseProceso).toBe("Homicidio")
    expect(data.llaveProceso).toBe(CPNU_TEST_RADICADO)
  })

  it("actuaciones retorna paginacion del fixture", async () => {
    const data = await client.actuaciones(CPNU_TEST_ID_PROCESO)

    expect(data.paginacion.cantidadRegistros).toBe(13)
    expect(data.actuaciones.length).toBeGreaterThanOrEqual(13)
  })

  it("rechaza radicado invalido con VALIDATION", async () => {
    try {
      await client.porRadicado("123")
      expect.unreachable("debio lanzar CpnuError")
    } catch (error) {
      expect(CpnuError.isCpnuError(error)).toBe(true)
      expect((error as CpnuError).code).toBe("VALIDATION")
    }
  })
})
