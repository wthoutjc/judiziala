import { config } from "dotenv"

config({ path: ".env.local", override: true })

const DEFAULT_ORIGIN = "https://judiziala.co"
const SAMPLE_COUNT = Number.parseInt(process.env.AUTH_OBS_SAMPLES ?? "20", 10)
const P95_MAX_MS = Number.parseInt(process.env.AUTH_OBS_P95_MAX_MS ?? "800", 10)

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0
  const index = Math.ceil((p / 100) * sortedValues.length) - 1
  return sortedValues[Math.max(0, index)]
}

async function timedFetch(url, options = {}) {
  const start = performance.now()
  const response = await fetch(url, { ...options, redirect: "manual" })
  const durationMs = Math.round(performance.now() - start)
  return { response, durationMs }
}

async function main() {
  const baseUrl = (process.env.AUTH_OBS_BASE_URL ?? DEFAULT_ORIGIN).replace(/\/$/, "")
  const failures = []

  console.log("=== verify:auth-observability ===")
  console.log(`Base URL: ${baseUrl}`)
  console.log(`Muestras heartbeat: ${SAMPLE_COUNT}`)
  console.log(`Umbral p95: ${P95_MAX_MS} ms`)
  console.log("")

  const heartbeatDurations = []

  for (let i = 0; i < SAMPLE_COUNT; i += 1) {
    const { response, durationMs } = await timedFetch(`${baseUrl}/api/heartbeat`, {
      method: "POST",
    })

    heartbeatDurations.push(durationMs)

    if (response.status >= 500) {
      failures.push(`heartbeat sample ${i + 1}: HTTP ${response.status}`)
    }
  }

  heartbeatDurations.sort((a, b) => a - b)
  const avgMs = Math.round(
    heartbeatDurations.reduce((sum, value) => sum + value, 0) /
      heartbeatDurations.length,
  )
  const p95Ms = percentile(heartbeatDurations, 95)
  const minMs = heartbeatDurations[0]
  const maxMs = heartbeatDurations[heartbeatDurations.length - 1]

  console.log("Heartbeat (sin cookie; esperado 401):")
  console.log(`  min=${minMs}ms avg=${avgMs}ms p95=${p95Ms}ms max=${maxMs}ms`)

  if (p95Ms > P95_MAX_MS) {
    failures.push(`heartbeat p95 ${p95Ms}ms supera umbral ${P95_MAX_MS}ms`)
  }

  const { response: signInResponse, durationMs: signInMs } = await timedFetch(
    `${baseUrl}/api/auth/signin/google`,
  )

  console.log("")
  console.log(`OAuth signin: HTTP ${signInResponse.status} en ${signInMs}ms`)

  if (signInResponse.status >= 500) {
    failures.push(`signin/google respondio ${signInResponse.status}`)
  }

  console.log("")
  console.log("Logs estructurados (Vercel Hobby):")
  console.log('  filtrar por "metric":"auth.heartbeat" o "metric":"auth.oauth"')
  console.log("")
  console.log("p95 historico en free tier:")
  console.log("  usar este script post-deploy o query SQL sobre AccessAuditLog")

  if (failures.length > 0) {
    console.log("")
    console.log("FALLOS:")
    for (const line of failures) console.log(`  - ${line}`)
    process.exit(1)
  }

  console.log("verify:auth-observability passed")
}

main().catch((error) => {
  console.error("verify:auth-observability failed:", error.message)
  process.exit(1)
})
