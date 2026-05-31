import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { headers } from "next/headers"
import type { Role } from "@/generated/prisma/enums"
import { authConfig, handleRouteAuthorization } from "@/auth.config"
import { extractSessionMetadata } from "@/lib/auth/session-metadata"
import {
  auditDeny,
  auditLogin,
  isAllowlistedEmail,
} from "@/lib/auth/audit"
import {
  logOAuthDeny,
  logOAuthError,
  logOAuthSuccess,
} from "@/lib/auth/auth-metrics"
import {
  getSessionExpiryForToken,
  shouldInvalidateSession,
} from "@/lib/auth/session-callback"
import {
  getSessionExpiryFromRequest,
  SESSION_ABSOLUTE_MAX_AGE_SEC,
} from "@/lib/auth/session-expiry"
import { createSingleSessionAdapter } from "@/lib/auth/single-session"
import {
  buildAuthCookies,
  shouldUseSecureCookies,
} from "@/lib/auth/secure-cookies"
import { isDemoAuthEnabled } from "@/lib/demo-mode"
import { db } from "@/lib/db"
import { env } from "@/lib/env"

const demoAuth = isDemoAuthEnabled()
const useSecureCookies = shouldUseSecureCookies()

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  useSecureCookies,
  cookies: buildAuthCookies(useSecureCookies),
  adapter: demoAuth ? undefined : createSingleSessionAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    ...(demoAuth
      ? [
          Credentials({
            id: "demo",
            name: "Demo",
            credentials: {},
            authorize() {
              return {
                id: "demo",
                name: "Usuario Demo",
                email: "demo@judiziala.local",
                role: "ABOGADO" as Role,
              }
            },
          }),
        ]
      : []),
  ],
  events: {
    async signIn({ user }) {
      if (demoAuth) return

      const metadata = extractSessionMetadata(await headers(), env.AUTH_SECRET)

      await db.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: metadata,
      })

      const session = await db.session.findFirst({
        where: { userId: user.id, revokedAt: null },
        orderBy: { lastSeenAt: "desc" },
        select: { id: true },
      })

      await auditLogin({
        userId: user.id,
        email: user.email ?? null,
        sessionId: session?.id ?? null,
        ipHash: metadata.ipHash,
        device: metadata.device,
      })

      logOAuthSuccess("google")
    },
  },
  logger: {
    error(code, ...message) {
      logOAuthError(String(code), message.map(String).join(" "))
    },
  },
  callbacks: {
    async signIn({ user }) {
      if (demoAuth) return true
      if (!user.email) {
        logOAuthDeny("missing_email")
        return false
      }

      const metadata = extractSessionMetadata(await headers(), env.AUTH_SECRET)

      const allowed = await isAllowlistedEmail(user.email)
      if (!allowed) {
        await auditDeny({
          email: user.email,
          userId: user.id ?? null,
          ipHash: metadata.ipHash,
          device: metadata.device,
          reason: "allowlist",
        })
        logOAuthDeny("allowlist")
        return false
      }

      return true
    },
    async authorized({ auth, request }) {
      const { nextUrl } = request

      if (nextUrl.pathname === "/sesion-cerrada") return true

      if (!demoAuth) {
        const expiry = await getSessionExpiryFromRequest(request)

        if (expiry === "revoked") {
          return Response.redirect(new URL("/sesion-cerrada", nextUrl))
        }

        if (expiry === "idle" || expiry === "absolute") {
          const loginUrl = new URL("/login", nextUrl)
          loginUrl.searchParams.set("reason", "session-expired")
          return Response.redirect(loginUrl)
        }
      }

      return handleRouteAuthorization({ auth, request })
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.role = (user as { role?: Role }).role ?? "ABOGADO"
      }
      return token
    },
    async session({ session, user, token }) {
      if (!session.user) return session

      if (demoAuth) {
        session.user.id = token.sub ?? session.user.id ?? ""
        session.user.role = (token.role as Role | undefined) ?? "ABOGADO"
        return session
      }

      const adapterSession = session as typeof session & {
        sessionToken?: string
      }

      const expiryReason = await getSessionExpiryForToken(
        adapterSession.sessionToken,
      )

      if (shouldInvalidateSession(expiryReason)) {
        return null as unknown as typeof session
      }

      const dbUser = user as { id: string; role?: Role }
      session.user.id = dbUser.id
      session.user.role = dbUser.role ?? "ABOGADO"

      return session
    },
  },
  session: {
    strategy: demoAuth ? "jwt" : "database",
    maxAge: demoAuth ? 30 * 24 * 60 * 60 : SESSION_ABSOLUTE_MAX_AGE_SEC,
  },
})
