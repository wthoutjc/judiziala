import { z } from "zod"
import { cpnuProcesoToProceso } from "@/lib/judicial/adapter"
import type { CpnuClient } from "@/lib/judicial/cpnu-client.impl"
import { CpnuError } from "@/lib/judicial/cpnu-error"
import type { CpnuPaginacion } from "@/lib/judicial/cpnu.schemas"
import { NlExtractorError } from "@/lib/judicial/nl-extractor.error"
import type { NlExtractor } from "@/lib/judicial/nl-extractor"
import type { NlExtractionResult } from "@/lib/judicial/nl-schema"
import {
  ProcesoRepository,
  ProcesoRepositoryError,
} from "@/lib/judicial/repository.impl"
import {
  buildCodificacionDespacho,
  normalizarEntidades,
  type CodigosResueltos,
} from "@/lib/judicial/catalogos"
import { assertCpnuUserRateLimit } from "@/lib/judicial/cpnu-user-rate-limit"
import {
  consultarNombreInputSchema,
  consultarNLInputSchema,
  consultarRadicadoInputSchema,
  interpretarNLInputSchema,
  monitorearInputSchema,
  type ConsultaResult,
  type ConsultarNombreInput,
  type ConsultarNLInput,
  type ConsultarNLResult,
  type ConsultarRadicadoInput,
  type InterpretarNLInput,
  type InterpretarNLResult,
  type MonitorearInput,
  type MonitorearResult,
  type PaginacionConsulta,
} from "./actions.types"
import type { ConfianzaMap, NlEntidades } from "@/lib/judicial/nl-schema"

export type ProcesosActionsDeps = {
  cpnuClient: CpnuClient
  repository: Pick<ProcesoRepository, "monitorear">
}

export type ConsultarNLDeps = ProcesosActionsDeps & {
  nlExtractor: Pick<NlExtractor, "extraer">
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "input"
      return `${path}: ${issue.message}`
    })
    .join("; ")
}

export function mapActionError(error: unknown): { error: string; code?: string } {
  if (CpnuError.isCpnuError(error)) {
    switch (error.code) {
      case "VALIDATION":
        return { code: error.code, error: "Los datos de consulta no son validos." }
      case "TIMEOUT":
        return {
          code: error.code,
          error: "La consulta a la Rama Judicial tardo demasiado. Intenta de nuevo.",
        }
      case "NETWORK":
        return {
          code: error.code,
          error: "No fue posible conectar con la Rama Judicial. Verifica tu conexion.",
        }
      case "HTTP":
        return {
          code: error.code,
          error: "La Rama Judicial respondio con un error. Intenta mas tarde.",
        }
      case "PARSE":
        return {
          code: error.code,
          error: "La respuesta de la Rama Judicial no pudo interpretarse.",
        }
      case "RATE_LIMITED":
        return {
          code: error.code,
          error: "Demasiadas consultas en poco tiempo. Espera un momento.",
        }
      case "USER_RATE_LIMITED":
        return {
          code: error.code,
          error:
            "Has superado el limite de consultas CPNU de tu cuenta. Intenta mas tarde.",
        }
      case "CIRCUIT_OPEN":
        return {
          code: error.code,
          error: "El servicio judicial no esta disponible temporalmente.",
        }
      default:
        return { code: error.code, error: error.message }
    }
  }

  if (NlExtractorError.isNlExtractorError(error)) {
    const msgs: Record<string, string> = {
      NO_TOOL_USE: "No se pudo interpretar la consulta. Intenta ser mas especifico.",
      VALIDATION:  "La informacion extraida de la consulta no es valida.",
      API_ERROR:   "El servicio de interpretacion no esta disponible. Intenta mas tarde.",
    }
    return {
      code: error.code,
      error: msgs[error.code] ?? "Error al interpretar la consulta.",
    }
  }

  if (error instanceof ProcesoRepositoryError) {
    switch (error.code) {
      case "CPNU_PROCESO_NOT_FOUND":
        return {
          code: error.code,
          error: "No se encontro el proceso en la Rama Judicial.",
        }
      case "NOT_MONITORED":
        return {
          code: error.code,
          error: "El proceso no esta en tu cartera.",
        }
      default:
        return { code: error.code, error: error.message }
    }
  }

  return { code: "UNKNOWN", error: "Error inesperado" }
}

function mapPaginacion(paginacion?: CpnuPaginacion): PaginacionConsulta | null {
  if (!paginacion) return null

  return {
    pagina: paginacion.pagina,
    cantidadPaginas: paginacion.cantidadPaginas,
    cantidadRegistros: paginacion.cantidadRegistros,
  }
}

async function consultarCpnu(
  userId: string,
  fetchConsulta: () => Promise<{
    procesos: Parameters<typeof cpnuProcesoToProceso>[0][]
    paginacion?: CpnuPaginacion
  }>
): Promise<ConsultaResult> {
  try {
    assertCpnuUserRateLimit(userId)
    const response = await fetchConsulta()

    return {
      ok: true,
      procesos: response.procesos.map((cpnu) => cpnuProcesoToProceso(cpnu)),
      paginacion: mapPaginacion(response.paginacion),
    }
  } catch (error) {
    const mapped = mapActionError(error)
    return { ok: false, ...mapped }
  }
}

export async function consultarRadicadoImpl(
  userId: string,
  input: ConsultarRadicadoInput,
  deps: ProcesosActionsDeps
): Promise<ConsultaResult> {
  const parsed = consultarRadicadoInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION",
      error: formatZodError(parsed.error),
    }
  }

  const { radicado, soloActivos, pagina } = parsed.data

  return consultarCpnu(userId, () =>
    deps.cpnuClient.porRadicado(radicado, { soloActivos, pagina })
  )
}

export async function consultarNombreImpl(
  userId: string,
  input: ConsultarNombreInput,
  deps: ProcesosActionsDeps
): Promise<ConsultaResult> {
  const parsed = consultarNombreInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION",
      error: formatZodError(parsed.error),
    }
  }

  const { nombre, tipoPersona, soloActivos, pagina, codificacionDespacho } =
    parsed.data

  return consultarCpnu(userId, () =>
    deps.cpnuClient.porNombre(nombre, tipoPersona, {
      soloActivos,
      pagina,
      codificacionDespacho,
    })
  )
}

async function ejecutarConsultaNl(
  userId: string,
  entidades: NlEntidades,
  codigos: CodigosResueltos,
  soloActivos: boolean,
  pagina: number,
  deps: ProcesosActionsDeps
): Promise<ConsultaResult> {
  if (entidades.radicado) {
    return consultarRadicadoImpl(
      userId,
      { radicado: entidades.radicado, soloActivos, pagina },
      deps
    )
  }

  if (entidades.nombre) {
    const codificacionDespacho = buildCodificacionDespacho(codigos) ?? undefined
    return consultarNombreImpl(
      userId,
      {
        nombre: entidades.nombre,
        tipoPersona: entidades.tipoPersona ?? "nat",
        soloActivos,
        pagina,
        codificacionDespacho,
      },
      deps
    )
  }

  return {
    ok: false,
    error:
      "No se pudo identificar el tipo de busqueda. " +
      "Incluye un radicado o el nombre de una parte del proceso.",
    code: "NL_AMBIGUOUS",
  }
}

export async function interpretarNLImpl(
  userId: string,
  input: InterpretarNLInput,
  deps: ConsultarNLDeps
): Promise<InterpretarNLResult> {
  void userId

  const parsed = interpretarNLInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION", error: formatZodError(parsed.error) }
  }

  let extraction: NlExtractionResult
  try {
    extraction = await deps.nlExtractor.extraer(parsed.data.texto)
  } catch (error) {
    const mapped = mapActionError(error)
    return { ok: false, ...mapped }
  }

  const normalizada = normalizarEntidades(extraction.entidades)

  return {
    ok: true,
    entidades: normalizada.entidades,
    confianza: extraction.confianza,
    codigos: normalizada.codigos,
    noResueltos: normalizada.noResueltos,
  }
}

export async function consultarNLImpl(
  userId: string,
  input: ConsultarNLInput,
  deps: ConsultarNLDeps
): Promise<ConsultarNLResult> {
  const parsed = consultarNLInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION", error: formatZodError(parsed.error) }
  }

  const { entidades, confianza: confianzaInput, soloActivos, pagina } =
    parsed.data
  const confianza = (confianzaInput ?? {}) as ConfianzaMap
  const normalizada = normalizarEntidades(entidades)

  const consultaResult = await ejecutarConsultaNl(
    userId,
    normalizada.entidades,
    normalizada.codigos,
    soloActivos,
    pagina,
    deps
  )

  if (!consultaResult.ok) return consultaResult

  return {
    ok: true,
    procesos: consultaResult.procesos,
    paginacion: consultaResult.paginacion,
    entidades: normalizada.entidades,
    confianza,
    codigos: normalizada.codigos,
  }
}

export async function monitorearImpl(
  userId: string,
  input: MonitorearInput,
  deps: ProcesosActionsDeps
): Promise<MonitorearResult> {
  const parsed = monitorearInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION",
      error: formatZodError(parsed.error),
    }
  }

  try {
    assertCpnuUserRateLimit(userId)
    const proceso = await deps.repository.monitorear(userId, parsed.data.cpnuIdProceso)

    return {
      ok: true,
      procesoId: proceso.id,
      radicado: proceso.radicado,
    }
  } catch (error) {
    const mapped = mapActionError(error)
    return { ok: false, ...mapped }
  }
}
