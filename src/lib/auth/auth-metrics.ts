export type AuthMetricPayload = {
  metric: string
  outcome?: string
  status?: string
  durationMs?: number
  httpStatus?: number
  provider?: string
  reason?: string
  code?: string
  bucket?: string
  retryAfterSec?: number
  detail?: string
}

export function isAuthMetricsEnabled(): boolean {
  const flag = process.env.AUTH_METRICS_ENABLED
  if (flag === "true") return true
  if (flag === "false") return false
  return process.env.NODE_ENV === "production"
}

export function logAuthMetric(payload: AuthMetricPayload): void {
  if (!isAuthMetricsEnabled()) return

  try {
    console.log(
      JSON.stringify({
        ...payload,
        ts: new Date().toISOString(),
      }),
    )
  } catch {
    // no-op: metricas no deben romper auth
  }
}

export function logOAuthSuccess(provider = "google"): void {
  logAuthMetric({
    metric: "auth.oauth",
    outcome: "success",
    provider,
  })
}

export function logOAuthDeny(reason: string, provider = "google"): void {
  logAuthMetric({
    metric: "auth.oauth",
    outcome: "deny",
    provider,
    reason,
  })
}

export function logOAuthError(code: string, detail?: string): void {
  logAuthMetric({
    metric: "auth.oauth",
    outcome: "error",
    code,
    detail: detail?.slice(0, 200),
  })
}

export function logHeartbeatMetric(
  status: string,
  durationMs: number,
  httpStatus: number,
): void {
  logAuthMetric({
    metric: "auth.heartbeat",
    status,
    durationMs,
    httpStatus,
  })
}

export function logRateLimitMetric(
  bucket: string,
  retryAfterSec: number,
): void {
  logAuthMetric({
    metric: "auth.rate_limit",
    bucket,
    retryAfterSec,
    httpStatus: 429,
  })
}
