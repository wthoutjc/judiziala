/** Origen canonico de produccion (Cloud Run + dominio custom). */
export const PRODUCTION_APP_ORIGIN = "https://judiziala.co"

export const GOOGLE_OAUTH_CALLBACK_PATH = "/api/auth/callback/google"

export function getGoogleOAuthCallbackUrl(origin = PRODUCTION_APP_ORIGIN): string {
  return `${origin.replace(/\/$/, "")}${GOOGLE_OAUTH_CALLBACK_PATH}`
}

export const GCP_OAUTH_REDIRECT_URIS = [
  getGoogleOAuthCallbackUrl(),
  "http://localhost:3000/api/auth/callback/google",
] as const

export const GCP_OAUTH_JAVASCRIPT_ORIGINS = [
  PRODUCTION_APP_ORIGIN,
  "http://localhost:3000",
] as const
