export type CpnuMetricPayload = {
  metric: "cpnu.request"
  outcome: "success" | "error"
  endpoint: string
  durationMs: number
  code?: string
  status?: number
}

export function isCpnuMetricsEnabled(): boolean {
  const flag = process.env.CPNU_METRICS_ENABLED
  if (flag === "true") return true
  if (flag === "false") return false
  return process.env.NODE_ENV === "production"
}

export function logCpnuMetric(payload: CpnuMetricPayload): void {
  if (!isCpnuMetricsEnabled()) return

  try {
    console.log(
      JSON.stringify({
        ...payload,
        ts: new Date().toISOString(),
      })
    )
  } catch {
    // metricas no deben romper consultas CPNU
  }
}
