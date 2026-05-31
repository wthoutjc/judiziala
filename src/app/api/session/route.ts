import {
  getCurrentSession,
  toCurrentSessionResponse,
} from "@/lib/auth/current-session"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return toCurrentSessionResponse(await getCurrentSession(request))
}
