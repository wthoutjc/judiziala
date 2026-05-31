export const SECURE_COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
}

export function shouldUseSecureCookies(): boolean {
  const authUrl = process.env.AUTH_URL?.replace(/\/$/, "")
  if (authUrl?.startsWith("https://")) return true
  return process.env.NODE_ENV === "production"
}

export function buildAuthCookies(useSecure: boolean) {
  return {
    sessionToken: {
      options: { ...SECURE_COOKIE_BASE, secure: useSecure },
    },
    callbackUrl: {
      options: { ...SECURE_COOKIE_BASE, secure: useSecure },
    },
    csrfToken: {
      options: { ...SECURE_COOKIE_BASE, secure: useSecure },
    },
    pkceCodeVerifier: {
      options: { ...SECURE_COOKIE_BASE, secure: useSecure, maxAge: 900 },
    },
    state: {
      options: { ...SECURE_COOKIE_BASE, secure: useSecure, maxAge: 900 },
    },
  }
}
