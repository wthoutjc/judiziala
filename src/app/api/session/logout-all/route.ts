import {
  logoutAllSessions,
  toLogoutAllResponse,
} from "@/lib/auth/logout-all"

export async function POST(request: Request) {
  return toLogoutAllResponse(await logoutAllSessions(request))
}
