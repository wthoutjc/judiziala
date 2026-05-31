import { runHeartbeat, toHeartbeatResponse } from "@/lib/auth/heartbeat"

export async function POST(request: Request) {
  return toHeartbeatResponse(await runHeartbeat(request))
}
