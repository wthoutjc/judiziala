import "server-only"

import { cacheCpnuFetch } from "./cpnu-cache"
import {
  cpnuCircuitBreaker,
  CpnuCircuitBreaker,
  CPNU_DEFAULT_CIRCUIT_COOLDOWN_MS,
  CPNU_DEFAULT_CIRCUIT_FAILURE_THRESHOLD,
  isInfrastructureFailure,
  type CircuitState,
} from "./cpnu-circuit-breaker"
import {
  createCpnuClient as createCpnuClientImpl,
  CpnuClient,
  cpnuClient as cpnuClientUncached,
  type CpnuClientConfig,
  CPNU_DEFAULT_BASE_URL,
  CPNU_DEFAULT_MAX_RETRIES,
  CPNU_DEFAULT_TIMEOUT_MS,
  CPNU_USER_AGENT,
} from "./cpnu-client.impl"
import {
  cpnuRateLimiter,
  CpnuRateLimiter,
  CPNU_DEFAULT_MAX_RPS,
  CPNU_DEFAULT_RATE_BURST,
  CPNU_DEFAULT_RATE_MAX_WAIT_MS,
} from "./cpnu-rate-limit"

export {
  CPNU_DEFAULT_BASE_URL,
  CPNU_DEFAULT_MAX_RETRIES,
  CPNU_DEFAULT_TIMEOUT_MS,
  CPNU_USER_AGENT,
  CpnuClient,
  type CpnuClientConfig,
}

export { CpnuError, type CpnuErrorCode } from "./cpnu-error"

export {
  buildCpnuCacheKey,
  CPNU_CACHE_TTL_SECONDS,
} from "./cpnu-cache-keys"

export {
  CpnuCircuitBreaker,
  CPNU_DEFAULT_CIRCUIT_COOLDOWN_MS,
  CPNU_DEFAULT_CIRCUIT_FAILURE_THRESHOLD,
  cpnuCircuitBreaker,
  isInfrastructureFailure,
  type CircuitState,
}

export {
  CpnuRateLimiter,
  CPNU_DEFAULT_MAX_RPS,
  CPNU_DEFAULT_RATE_BURST,
  CPNU_DEFAULT_RATE_MAX_WAIT_MS,
  cpnuRateLimiter,
}

export type {
  ActuacionesResponse,
  ConsultaResponse,
  DetalleResponse,
} from "./cpnu.schemas"

export function createCpnuClient(config: CpnuClientConfig = {}): CpnuClient {
  return createCpnuClientImpl({
    ...config,
    cacheFetch:
      config.cacheFetch ??
      ((key, fetcher) => cacheCpnuFetch(key, fetcher)),
    rateLimiter:
      config.rateLimiter === null
        ? undefined
        : (config.rateLimiter ?? cpnuRateLimiter),
    circuitBreaker:
      config.circuitBreaker === null
        ? undefined
        : (config.circuitBreaker ?? cpnuCircuitBreaker),
  })
}

export const cpnuClient = createCpnuClient()

/** Cliente sin caché ni resiliencia (scripts/tests fuera de Next.js). */
export { cpnuClientUncached }
