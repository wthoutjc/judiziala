import type { z } from "zod"
import type { CpnuCircuitBreaker } from "./cpnu-circuit-breaker"
import { buildCpnuCacheKey } from "./cpnu-cache-keys"
import { CpnuError } from "./cpnu-error"
import type { CpnuRateLimiter } from "./cpnu-rate-limit"
import {
  cpnuIdProcesoInput,
  cpnuNombreInput,
  cpnuPaginaInput,
  cpnuRadicadoInput,
  cpnuTipoPersonaInput,
} from "./cpnu-input.schemas"
import {
  parseActuacionesResponse,
  parseConsultaResponse,
  parseDetalleResponse,
  type ActuacionesResponse,
  type ConsultaResponse,
  type DetalleResponse,
} from "./cpnu.schemas"

export const CPNU_DEFAULT_BASE_URL =
  "https://consultaprocesos.ramajudicial.gov.co:448"

export const CPNU_DEFAULT_TIMEOUT_MS = 10_000
export const CPNU_DEFAULT_MAX_RETRIES = 2
export const CPNU_USER_AGENT = "Judiziala-portal-web/0.1"

export type CpnuCacheFetch = <T>(
  key: string[],
  fetcher: () => Promise<T>
) => Promise<T>

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504])
const RETRY_BASE_DELAY_MS = 500

export interface CpnuClientConfig {
  baseUrl?: string
  timeoutMs?: number
  maxRetries?: number
  userAgent?: string
  fetchImpl?: typeof fetch
  cacheFetch?: CpnuCacheFetch
  rateLimiter?: CpnuRateLimiter | null
  circuitBreaker?: CpnuCircuitBreaker | null
}

type ResolvedCpnuClientConfig = Required<
  Pick<
    CpnuClientConfig,
    "baseUrl" | "timeoutMs" | "maxRetries" | "userAgent" | "fetchImpl"
  >
> & {
  cacheFetch?: CpnuCacheFetch
  rateLimiter?: CpnuRateLimiter | null
  circuitBreaker?: CpnuCircuitBreaker | null
}

export class CpnuClient {
  private readonly config: ResolvedCpnuClientConfig

  constructor(config: CpnuClientConfig = {}) {
    this.config = {
      baseUrl: normalizeBaseUrl(config.baseUrl ?? process.env.CPNU_BASE_URL ?? CPNU_DEFAULT_BASE_URL),
      timeoutMs: config.timeoutMs ?? CPNU_DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries ?? CPNU_DEFAULT_MAX_RETRIES,
      userAgent: config.userAgent ?? CPNU_USER_AGENT,
      fetchImpl: config.fetchImpl ?? fetch,
      cacheFetch: config.cacheFetch,
      rateLimiter: config.rateLimiter,
      circuitBreaker: config.circuitBreaker,
    }
  }

  static fromEnv(overrides: CpnuClientConfig = {}): CpnuClient {
    return new CpnuClient(overrides)
  }

  async porRadicado(
    radicado: string,
    options?: { soloActivos?: boolean; pagina?: number }
  ): Promise<ConsultaResponse> {
    const numero = this.validateInput(cpnuRadicadoInput, radicado, "radicado")
    const pagina = this.validateInput(
      cpnuPaginaInput,
      options?.pagina ?? 1,
      "pagina"
    )
    const soloActivos = options?.soloActivos ?? false

    const data = await this.fetchJsonCached(
      "/api/v2/Procesos/Consulta/NumeroRadicacion",
      {
        numero,
        SoloActivos: soloActivos,
        pagina,
      }
    )

    return parseConsultaResponse(data)
  }

  async porNombre(
    nombre: string,
    tipoPersona: "nat" | "jur",
    options?: {
      soloActivos?: boolean
      codificacionDespacho?: string
      pagina?: number
    }
  ): Promise<ConsultaResponse> {
    const nombreValidado = this.validateInput(cpnuNombreInput, nombre, "nombre")
    const tipoPersonaValidado = this.validateInput(
      cpnuTipoPersonaInput,
      tipoPersona,
      "tipoPersona"
    )
    const pagina = this.validateInput(
      cpnuPaginaInput,
      options?.pagina ?? 1,
      "pagina"
    )
    const soloActivos = options?.soloActivos ?? false
    const codificacionDespacho = options?.codificacionDespacho ?? ""

    const data = await this.fetchJsonCached(
      "/api/v2/Procesos/Consulta/NombreRazonSocial",
      {
        nombre: nombreValidado,
        tipoPersona: tipoPersonaValidado,
        SoloActivos: soloActivos,
        codificacionDespacho,
        pagina,
      }
    )

    return parseConsultaResponse(data)
  }

  async detalle(idProceso: number): Promise<DetalleResponse> {
    const id = this.validateInput(cpnuIdProcesoInput, idProceso, "idProceso")
    const data = await this.fetchJsonCached(`/api/v2/Proceso/Detalle/${id}`)
    return parseDetalleResponse(data)
  }

  async actuaciones(
    idProceso: number,
    options?: { pagina?: number }
  ): Promise<ActuacionesResponse> {
    const id = this.validateInput(cpnuIdProcesoInput, idProceso, "idProceso")
    const pagina = this.validateInput(
      cpnuPaginaInput,
      options?.pagina ?? 1,
      "pagina"
    )

    const data = await this.fetchJsonCached(`/api/v2/Proceso/Actuaciones/${id}`, {
      pagina,
    })

    return parseActuacionesResponse(data)
  }

  async fetchJson(
    path: string,
    searchParams?: Record<string, string | number | boolean>
  ): Promise<unknown> {
    this.config.circuitBreaker?.assertClosed()
    await this.config.rateLimiter?.acquire()

    const url = buildUrl(this.config.baseUrl, path, searchParams)

    try {
      const response = await this.requestWithRetry(url)
      const data = await this.parseJsonResponse(url, response)
      this.config.circuitBreaker?.recordSuccess()
      return data
    } catch (error) {
      if (error instanceof CpnuError) {
        this.config.circuitBreaker?.recordFailure(error)
      }
      throw error
    }
  }

  private async fetchJsonCached(
    path: string,
    searchParams?: Record<string, string | number | boolean>
  ): Promise<unknown> {
    if (!this.config.cacheFetch) {
      return this.fetchJson(path, searchParams)
    }

    const key = buildCpnuCacheKey(path, searchParams)
    return this.config.cacheFetch(key, () => this.fetchJson(path, searchParams))
  }

  private validateInput<T>(
    schema: z.ZodType<T>,
    data: unknown,
    label: string
  ): T {
    const result = schema.safeParse(data)
    if (!result.success) {
      throw CpnuError.fromZod(
        `CPNU entrada invalida (${label}): ${formatZodError(result.error)}`,
        result.error
      )
    }
    return result.data
  }

  private async requestWithRetry(url: string): Promise<Response> {
    const maxAttempts = this.config.maxRetries + 1
    let lastError: unknown

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1))
      }

      try {
        const response = await this.config.fetchImpl(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": this.config.userAgent,
          },
          signal: AbortSignal.timeout(this.config.timeoutMs),
        })

        if (this.isRetryableResponse(response) && attempt < maxAttempts - 1) {
          lastError = new CpnuError(`CPNU HTTP ${response.status}`, "HTTP", {
            status: response.status,
            url,
          })
          continue
        }

        return response
      } catch (error) {
        lastError = error
        if (!this.isRetryableError(error) || attempt >= maxAttempts - 1) {
          throw wrapRequestError(url, error)
        }
      }
    }

    throw wrapRequestError(url, lastError)
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof CpnuError) {
      return error.code === "TIMEOUT" || error.code === "NETWORK"
    }

    if (error instanceof DOMException && error.name === "TimeoutError") {
      return true
    }

    if (error instanceof Error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        return true
      }
      if (error.message.includes("fetch failed")) {
        return true
      }
    }

    return error instanceof TypeError
  }

  private isRetryableResponse(response: Response): boolean {
    return RETRYABLE_STATUS_CODES.has(response.status)
  }

  private async parseJsonResponse(url: string, response: Response): Promise<unknown> {
    if (!response.ok) {
      const body = await response.text()
      const snippet = body.slice(0, 200).replace(/\s+/g, " ").trim()
      throw new CpnuError(
        `CPNU HTTP ${response.status}: ${snippet || response.statusText} (${url})`,
        "HTTP",
        { status: response.status, url }
      )
    }

    try {
      return await response.json()
    } catch (error) {
      throw new CpnuError(
        `CPNU JSON invalido (${url}): ${error instanceof Error ? error.message : "parse error"}`,
        "PARSE",
        { cause: error, url }
      )
    }
  }
}

export function createCpnuClient(config?: CpnuClientConfig): CpnuClient {
  return new CpnuClient(config)
}

export const cpnuClient = createCpnuClient()

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "")
}

function buildUrl(
  baseUrl: string,
  path: string,
  searchParams?: Record<string, string | number | boolean>
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const url = new URL(`${baseUrl}${normalizedPath}`)

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root"
      return `${path}: ${issue.message}`
    })
    .join("; ")
}

function wrapRequestError(url: string, error: unknown): CpnuError {
  if (error instanceof CpnuError) {
    return error
  }

  if (error instanceof DOMException && error.name === "TimeoutError") {
    return new CpnuError(`CPNU request timeout (${url})`, "TIMEOUT", {
      cause: error,
      url,
    })
  }

  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return new CpnuError(`CPNU request timeout (${url})`, "TIMEOUT", {
        cause: error,
        url,
      })
    }

    return new CpnuError(`CPNU request failed (${url}): ${error.message}`, "NETWORK", {
      cause: error,
      url,
    })
  }

  return new CpnuError(`CPNU request failed (${url})`, "NETWORK", { url })
}
