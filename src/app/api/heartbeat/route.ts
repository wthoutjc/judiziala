import { runHeartbeat, toHeartbeatResponse } from "@/lib/auth/heartbeat"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return toHeartbeatResponse(await runHeartbeat(request))
}
