import { CpnuError } from "./cpnu-error"

export const CPNU_DEFAULT_CIRCUIT_FAILURE_THRESHOLD = 5
export const CPNU_DEFAULT_CIRCUIT_COOLDOWN_MS = 60_000

export type CircuitState = "closed" | "open" | "half_open"

const INFRASTRUCTURE_HTTP_STATUSES = new Set([429, 502, 503, 504])

export interface CpnuCircuitBreakerConfig {
  failureThreshold?: number
  cooldownMs?: number
  now?: () => number
}

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) {
    return fallback
  }

  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function isInfrastructureFailure(error: CpnuError): boolean {
  if (error.code === "TIMEOUT" || error.code === "NETWORK") {
    return true
  }

  if (error.code === "HTTP" && error.status !== undefined) {
    return INFRASTRUCTURE_HTTP_STATUSES.has(error.status)
  }

  return false
}

export class CpnuCircuitBreaker {
  private readonly failureThreshold: number
  private readonly cooldownMs: number
  private readonly now: () => number
  private state: CircuitState = "closed"
  private consecutiveFailures = 0
  private openedAtMs: number | null = null

  constructor(config: CpnuCircuitBreakerConfig = {}) {
    this.failureThreshold =
      config.failureThreshold ??
      parseEnvInt(
        "CPNU_CIRCUIT_FAILURE_THRESHOLD",
        CPNU_DEFAULT_CIRCUIT_FAILURE_THRESHOLD
      )
    this.cooldownMs =
      config.cooldownMs ??
      parseEnvInt("CPNU_CIRCUIT_COOLDOWN_MS", CPNU_DEFAULT_CIRCUIT_COOLDOWN_MS)
    this.now = config.now ?? Date.now
  }

  getState(): CircuitState {
    this.refreshState()
    return this.state
  }

  assertClosed(): void {
    this.refreshState()

    if (this.state === "open") {
      throw new CpnuError(
        "CPNU temporalmente no disponible (circuit breaker abierto)",
        "CIRCUIT_OPEN"
      )
    }
  }

  recordSuccess(): void {
    this.refreshState()
    this.consecutiveFailures = 0
    this.openedAtMs = null
    this.state = "closed"
  }

  recordFailure(error: CpnuError): void {
    if (!isInfrastructureFailure(error)) {
      return
    }

    this.refreshState()

    if (this.state === "half_open") {
      this.openCircuit()
      return
    }

    this.consecutiveFailures += 1

    if (this.consecutiveFailures >= this.failureThreshold) {
      this.openCircuit()
    }
  }

  private openCircuit(): void {
    this.state = "open"
    this.openedAtMs = this.now()
    this.consecutiveFailures = 0
  }

  private refreshState(): void {
    if (this.state !== "open" || this.openedAtMs === null) {
      return
    }

    if (this.now() - this.openedAtMs >= this.cooldownMs) {
      this.state = "half_open"
    }
  }
}

// Estado in-memory por instancia de proceso (MVP; Redis post-MVP).
export const cpnuCircuitBreaker = new CpnuCircuitBreaker()
