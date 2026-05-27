import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { isDemoMode } from "@/lib/demo-mode"

const providers = [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
  }),
  GitHub({
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
  }),
]

if (isDemoMode()) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {},
      authorize() {
        return {
          id: "demo",
          name: "Usuario Demo",
          email: "demo@judiziala.local",
        }
      },
    })
  )
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/procesos") ||
        nextUrl.pathname.startsWith("/documentos") ||
        nextUrl.pathname.startsWith("/alertas")

      if (isOnDashboard) {
        if (isLoggedIn || isDemoMode()) return true
        return false
      } else if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
    session({ session, token }) {
      if (token?.sub) session.user.id = token.sub
      return session
    },
  },
  session: { strategy: "jwt" },
})
