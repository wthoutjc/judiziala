import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authConfig } from "@/auth.config"
import { checkRateLimit, isRateLimitedRoute } from "@/lib/auth/edge-rate-limit"

const { auth } = NextAuth(authConfig)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isRateLimitedRoute(pathname, request.method)) {
    const blocked = checkRateLimit(request)
    if (blocked) return blocked
    return NextResponse.next()
  }

  return auth(request)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
    "/api/heartbeat",
    "/api/auth/:path*",
  ],
}
