import { runHeartbeat, toHeartbeatResponse } from "@/lib/auth/heartbeat"
import { logHeartbeatMetric } from "@/lib/auth/auth-metrics"

export const runtime = "nodejs"

function heartbeatHttpStatus(status: Awaited<ReturnType<typeof runHeartbeat>>): number {
  if (status === "ok") return 204
  return 401
}

export async function POST(request: Request) {
  const start = performance.now()
  const status = await runHeartbeat(request)
  const durationMs = Math.round(performance.now() - start)

  logHeartbeatMetric(status, durationMs, heartbeatHttpStatus(status))

  return toHeartbeatResponse(status)
}
