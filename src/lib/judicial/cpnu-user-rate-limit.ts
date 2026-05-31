import { CpnuError } from "./cpnu-error"

export const CPNU_USER_RL_MAX_DEFAULT = 30
export const CPNU_USER_RL_WINDOW_MS_DEFAULT = 600_000

type WindowEntry = {
  count: number
  windowStart: number
}

const store = new Map<string, WindowEntry>()
let nowFn: () => number = Date.now

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback

  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function getConfig(): { max: number; windowMs: number } {
  return {
    max: parseEnvInt("CPNU_USER_RL_MAX", CPNU_USER_RL_MAX_DEFAULT),
    windowMs: parseEnvInt(
      "CPNU_USER_RL_WINDOW_MS",
      CPNU_USER_RL_WINDOW_MS_DEFAULT
    ),
  }
}

export function resetCpnuUserRateLimitStoreForTests(now?: () => number): void {
  store.clear()
  nowFn = now ?? Date.now
}

export function assertCpnuUserRateLimit(userId: string): void {
  const { max, windowMs } = getConfig()
  const now = nowFn()
  const key = userId.trim()
  if (!key) return

  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return
  }

  if (entry.count >= max) {
    throw new CpnuError(
      "Cuota de consultas CPNU excedida para este usuario",
      "USER_RATE_LIMITED"
    )
  }

  entry.count += 1
}
