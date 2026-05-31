import {
  getCurrentSession,
  toCurrentSessionResponse,
} from "@/lib/auth/current-session"

export async function GET(request: Request) {
  return toCurrentSessionResponse(await getCurrentSession(request))
}
