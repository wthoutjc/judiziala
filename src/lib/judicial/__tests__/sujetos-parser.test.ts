import { describe, expect, it } from "vitest"
import { normalizeRolSujeto, parseSujetosProcesales } from "../adapter"
import { parseConsultaResponse } from "../cpnu.schemas"
import { loadFixture } from "./helpers/fixtures"

describe("parseSujetosProcesales", () => {
  const fixtureRaw = parseConsultaResponse(loadFixture("consulta-radicado.json")).procesos[0]
    .sujetosProcesales

  it("divide por pipe y dos puntos en el fixture real", () => {
    const partes = parseSujetosProcesales(fixtureRaw)

    expect(partes).toHaveLength(8)
    expect(partes.map((p) => p.rol)).toEqual([
      "demandante",
      "demandado",
      "fiscalia",
      "numero_interno",
      "defensor",
      "defensor",
      "otro",
      "apoderado_victima",
    ])
  })

  it("conserva el segmento original en raw", () => {
    const [demandado] = parseSujetosProcesales(
      "Demandado: EDIBER CEFERINO RINCON"
    )

    expect(demandado.nombre).toBe("EDIBER CEFERINO RINCON")
    expect(demandado.raw).toBe("Demandado: EDIBER CEFERINO RINCON")
  })

  it("normaliza acentos y variantes de rol", () => {
    expect(normalizeRolSujeto("Fiscalía")).toBe("fiscalia")
    expect(normalizeRolSujeto("DEMANDANTE")).toBe("demandante")
    expect(normalizeRolSujeto("Apoderado de la Víctima")).toBe("apoderado_victima")
    expect(normalizeRolSujeto("Numero Interno")).toBe("numero_interno")
  })

  it("trata segmentos sin dos puntos como otro", () => {
    const partes = parseSujetosProcesales("Sujeto sin formato")

    expect(partes).toHaveLength(1)
    expect(partes[0].rol).toBe("otro")
    expect(partes[0].nombre).toBe("Sujeto sin formato")
  })

  it("retorna arreglo vacio para texto vacio", () => {
    expect(parseSujetosProcesales("")).toEqual([])
    expect(parseSujetosProcesales("   ")).toEqual([])
  })
})
