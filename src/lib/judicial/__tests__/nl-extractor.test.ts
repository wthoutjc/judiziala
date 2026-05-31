import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/env", () => ({
  env: {
    ANTHROPIC_API_KEY: "test-key",
  },
}))

import { CPNU_TEST_NOMBRE, CPNU_TEST_RADICADO } from "./helpers/fixtures"
import { NlExtractorError } from "../nl-extractor.error"
import { NlExtractor, type NlExtractorClient } from "../nl-extractor"

function createMockClient(
  createImpl: NlExtractorClient["messages"]["create"]
): NlExtractorClient {
  return { messages: { create: createImpl } }
}

describe("nl-extractor", () => {
  it("extrae radicado sin guiones desde tool_use", async () => {
    const client = createMockClient(
      vi.fn().mockResolvedValue({
        content: [
          {
            type: "tool_use",
            input: {
              radicado: CPNU_TEST_RADICADO,
              confianza: { radicado: 1 },
            },
          },
        ],
      })
    )

    const result = await new NlExtractor(client).extraer(
      `Proceso ${CPNU_TEST_RADICADO}`
    )

    expect(result.entidades.radicado).toBe(CPNU_TEST_RADICADO)
    expect(result.confianza.radicado).toBe(1)
    expect(result.textoOriginal).toContain(CPNU_TEST_RADICADO)
  })

  it("extrae nombre y tipoPersona", async () => {
    const client = createMockClient(
      vi.fn().mockResolvedValue({
        content: [
          {
            type: "tool_use",
            input: {
              nombre: CPNU_TEST_NOMBRE,
              tipoPersona: "nat",
              confianza: { nombre: 0.9, tipoPersona: 0.8 },
            },
          },
        ],
      })
    )

    const result = await new NlExtractor(client).extraer(
      `Buscar procesos de ${CPNU_TEST_NOMBRE}`
    )

    expect(result.entidades).toEqual({
      nombre: CPNU_TEST_NOMBRE,
      tipoPersona: "nat",
    })
  })

  it("lanza NO_TOOL_USE si el modelo no usa herramienta", async () => {
    const client = createMockClient(
      vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "No entendi" }],
      })
    )

    await expect(new NlExtractor(client).extraer("hola")).rejects.toMatchObject({
      code: "NO_TOOL_USE",
    })
  })

  it("lanza VALIDATION si las entidades no pasan el schema", async () => {
    const client = createMockClient(
      vi.fn().mockResolvedValue({
        content: [
          {
            type: "tool_use",
            input: { radicado: "123" },
          },
        ],
      })
    )

    await expect(
      new NlExtractor(client).extraer("radicado 123")
    ).rejects.toMatchObject({ code: "VALIDATION" })
  })

  it("lanza API_ERROR si falla la llamada a Anthropic", async () => {
    const client = createMockClient(
      vi.fn().mockRejectedValue(new Error("network down"))
    )

    await expect(new NlExtractor(client).extraer("consulta")).rejects.toSatisfy(
      (error: unknown) =>
        NlExtractorError.isNlExtractorError(error) && error.code === "API_ERROR"
    )
  })
})
