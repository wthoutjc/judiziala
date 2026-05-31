import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authConfig, handleRouteAuthorization } from "@/auth.config"
import { checkRateLimit, isRateLimitedRoute } from "@/lib/auth/edge-rate-limit"
import { hasSessionCookie } from "@/lib/auth/session-cookie-edge"

/**
 * Middleware Edge sin NextAuth.getSession().
 * En prod las sesiones son DB (cookie = sessionToken opaco); decodificarlas como JWT
 * provoca JWTSessionError y borra la cookie en cada request.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isRateLimitedRoute(pathname, request.method)) {
    const blocked = checkRateLimit(request)
    if (blocked) return blocked
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const sessionCookie = hasSessionCookie(request)
  const authorized = handleRouteAuthorization({
    auth: null,
    request,
    hasSessionCookie: sessionCookie,
  })

  if (authorized instanceof Response) {
    return authorized
  }

  if (!authorized) {
    const signInPage = authConfig.pages?.signIn ?? "/login"
    if (pathname !== signInPage) {
      const signInUrl = request.nextUrl.clone()
      signInUrl.pathname = signInPage
      signInUrl.searchParams.set("callbackUrl", request.nextUrl.href)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
    "/api/heartbeat",
    "/api/auth/:path*",
  ],
}
