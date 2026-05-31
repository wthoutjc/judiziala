import "server-only"

import Anthropic from "@anthropic-ai/sdk"
import { env } from "@/lib/env"
import { NlExtractorError } from "./nl-extractor.error"
import { nlEntidadesSchema } from "./nl-schema"
import type { ConfianzaMap, NlExtractionResult } from "./nl-schema"

export { NlExtractorError, type NlExtractorErrorCode } from "./nl-extractor.error"

// ─── Tool definition ──────────────────────────────────────────────────────────

const EXTRAER_TOOL: Anthropic.Tool = {
  name: "extraer_entidades_proceso",
  description:
    "Extrae entidades estructuradas de una consulta judicial en lenguaje natural. " +
    "Extrae SOLO lo que aparece explicitamente en el texto. " +
    "Nunca inventes radicados ni construyas URLs ni codigo de ningun tipo.",
  input_schema: {
    type: "object",
    properties: {
      radicado: {
        type: "string",
        description:
          "Numero de radicado de 23 digitos numericos, " +
          "solo si aparece verbatim en el texto (con o sin guiones).",
      },
      nombre: {
        type: "string",
        description:
          "Nombre completo o razon social de una parte del proceso " +
          "(demandante, demandado, etc.).",
      },
      tipoPersona: {
        type: "string",
        enum: ["nat", "jur"],
        description:
          "Tipo de persona: nat = persona natural, jur = juridica/empresa. " +
          "Infiere solo si hay indicios claros en el texto.",
      },
      depto: {
        type: "string",
        description: "Departamento colombiano mencionado (Antioquia, Cundinamarca, etc.).",
      },
      ciudad: {
        type: "string",
        description: "Ciudad o municipio colombiano mencionado.",
      },
      especialidad: {
        type: "string",
        description:
          "Especialidad judicial mencionada (penal, civil, laboral, familia, etc.).",
      },
      anio: {
        type: "number",
        description:
          "Anio de radicacion del proceso, entero entre 1900 y 2100. " +
          "Solo incluir si aparece explicitamente en el texto.",
      },
      despacho: {
        type: "string",
        description:
          "Nombre del juzgado o despacho judicial mencionado textualmente, " +
          "por ejemplo 'Juzgado 3 Civil del Circuito de Bogota'. " +
          "Solo si aparece de forma explicita en el texto.",
      },
      confianza: {
        type: "object",
        description:
          "Nivel de confianza entre 0 y 1 para cada campo extraido. " +
          "Incluir solo los campos que fueron efectivamente extraidos. " +
          "1.0 = certeza total, 0.5 = inferencia razonable, <0.3 = especulacion.",
        properties: {
          radicado:    { type: "number", minimum: 0, maximum: 1 },
          nombre:      { type: "number", minimum: 0, maximum: 1 },
          tipoPersona: { type: "number", minimum: 0, maximum: 1 },
          depto:       { type: "number", minimum: 0, maximum: 1 },
          ciudad:      { type: "number", minimum: 0, maximum: 1 },
          especialidad:{ type: "number", minimum: 0, maximum: 1 },
          anio:        { type: "number", minimum: 0, maximum: 1 },
          despacho:    { type: "number", minimum: 0, maximum: 1 },
        },
        additionalProperties: false,
      },
    },
    required: [],
    additionalProperties: false,
  },
}

const SYSTEM_PROMPT =
  "Eres un asistente especializado en derecho colombiano. " +
  "Tu unica tarea es extraer entidades de consultas judiciales en lenguaje natural. " +
  "Reglas estrictas:\n" +
  "1. Extrae SOLO lo que aparece explicitamente en el texto del usuario.\n" +
  "2. Nunca inventes, inferas ni construyas numeros de radicado.\n" +
  "3. Si el texto menciona un radicado con guiones, transcribelo sin guiones " +
  "(solo los 23 digitos).\n" +
  "4. Nunca construyas URLs, consultas SQL ni codigo de ningun tipo.\n" +
  "5. Si no puedes identificar una entidad con certeza razonable, omitela.\n" +
  "6. Responde SIEMPRE usando la herramienta extraer_entidades_proceso.\n" +
  "7. Asigna confianza < 0.5 solo cuando el dato es una inferencia debil."

// ─── NlExtractor ─────────────────────────────────────────────────────────────

export type NlExtractorClient = Pick<Anthropic, "messages">

export class NlExtractor {
  private readonly client: NlExtractorClient

  constructor(apiKey: string)
  constructor(client: NlExtractorClient)
  constructor(apiKeyOrClient: string | NlExtractorClient) {
    this.client =
      typeof apiKeyOrClient === "string"
        ? new Anthropic({ apiKey: apiKeyOrClient })
        : apiKeyOrClient
  }

  async extraer(texto: string): Promise<NlExtractionResult> {
    let response: Anthropic.Message

    try {
      response = await this.client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tool_choice: { type: "any" },
        tools: [EXTRAER_TOOL],
        messages: [{ role: "user", content: texto }],
      })
    } catch (error) {
      throw new NlExtractorError(
        "Error al llamar a la API de Anthropic.",
        "API_ERROR",
        error
      )
    }

    // Buscar el bloque tool_use en la respuesta
    const toolBlock = response.content.find((b) => b.type === "tool_use")
    if (!toolBlock || toolBlock.type !== "tool_use") {
      throw new NlExtractorError(
        "El modelo no uso la herramienta de extraccion.",
        "NO_TOOL_USE"
      )
    }

    // Separar confianza del resto de los campos antes de validar
    const raw = toolBlock.input as Record<string, unknown>
    const { confianza: rawConfianza, ...rawEntidades } = raw

    // Validar entidades con el schema de negocio
    const parsed = nlEntidadesSchema.safeParse(rawEntidades)
    if (!parsed.success) {
      throw new NlExtractorError(
        "Las entidades extraidas no son validas segun el schema.",
        "VALIDATION",
        parsed.error
      )
    }

    return {
      entidades: parsed.data,
      confianza: ((rawConfianza ?? {}) as ConfianzaMap),
      textoOriginal: texto,
    }
  }

  static fromEnv(): NlExtractor {
    const key = env.ANTHROPIC_API_KEY
    if (!key) {
      throw new NlExtractorError(
        "ANTHROPIC_API_KEY no esta configurada en el entorno.",
        "API_ERROR"
      )
    }
    return new NlExtractor(key)
  }
}
