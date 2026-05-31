import { CpnuError } from "./cpnu-error"

export const CPNU_DEFAULT_MAX_RPS = 2
export const CPNU_DEFAULT_RATE_BURST = 3
export const CPNU_DEFAULT_RATE_MAX_WAIT_MS = 5_000

export interface CpnuRateLimiterConfig {
  maxRps?: number
  burst?: number
  maxWaitMs?: number
  now?: () => number
  sleep?: (ms: number) => Promise<void>
}

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) {
    return fallback
  }

  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export class CpnuRateLimiter {
  private readonly maxRps: number
  private readonly burst: number
  private readonly maxWaitMs: number
  private readonly now: () => number
  private readonly sleep: (ms: number) => Promise<void>
  private tokens: number
  private lastRefillMs: number

  constructor(config: CpnuRateLimiterConfig = {}) {
    this.maxRps = config.maxRps ?? parseEnvInt("CPNU_MAX_RPS", CPNU_DEFAULT_MAX_RPS)
    this.burst = config.burst ?? CPNU_DEFAULT_RATE_BURST
    this.maxWaitMs = config.maxWaitMs ?? CPNU_DEFAULT_RATE_MAX_WAIT_MS
    this.now = config.now ?? Date.now
    this.sleep =
      config.sleep ??
      ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
    this.tokens = this.burst
    this.lastRefillMs = this.now()
  }

  async acquire(): Promise<void> {
    const deadline = this.now() + this.maxWaitMs

    while (true) {
      this.refillTokens()

      if (this.tokens >= 1) {
        this.tokens -= 1
        return
      }

      if (this.now() >= deadline) {
        throw new CpnuError(
          "CPNU rate limit: espera maxima excedida",
          "RATE_LIMITED"
        )
      }

      const msUntilToken = Math.ceil(1000 / this.maxRps)
      const remainingWait = deadline - this.now()
      await this.sleep(Math.min(msUntilToken, remainingWait))
    }
  }

  private refillTokens(): void {
    const now = this.now()
    const elapsedMs = now - this.lastRefillMs

    if (elapsedMs <= 0) {
      return
    }

    const tokensToAdd = (elapsedMs / 1000) * this.maxRps
    this.tokens = Math.min(this.burst, this.tokens + tokensToAdd)
    this.lastRefillMs = now
  }
}

// Estado in-memory por instancia de proceso (MVP; Redis post-MVP).
export const cpnuRateLimiter = new CpnuRateLimiter()
