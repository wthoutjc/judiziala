import type { NextAuthConfig } from "next-auth"

const protectedPrefixes = [
  "/dashboard",
  "/procesos",
  "/documentos",
  "/alertas",
  "/configuracion",
] as const

/** Solo rutas; sin Prisma. Usado por middleware (Edge). */
export function handleRouteAuthorization({
  auth,
  request,
}: {
  auth: { user?: unknown } | null
  request: { nextUrl: URL }
}): boolean | Response {
  const { nextUrl } = request

  if (nextUrl.pathname === "/sesion-cerrada") return true

  const isLoggedIn = !!auth?.user
  const isProtected = protectedPrefixes.some((prefix) =>
    nextUrl.pathname.startsWith(prefix),
  )

  if (isProtected) {
    if (isLoggedIn) return true
    return false
  }

  if (isLoggedIn && nextUrl.pathname === "/login") {
    return Response.redirect(new URL("/dashboard", nextUrl))
  }

  return true
}

/** Config Edge-safe: sin adapter, db ni providers con secretos. */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized: handleRouteAuthorization,
  },
} satisfies NextAuthConfig
