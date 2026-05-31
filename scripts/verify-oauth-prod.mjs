import { config } from "dotenv"

config({ path: ".env.local", override: true })

const PRODUCTION_APP_ORIGIN = "https://judiziala.co"
const GOOGLE_CALLBACK = `${PRODUCTION_APP_ORIGIN}/api/auth/callback/google`
const LOCAL_CALLBACK = "http://localhost:3000/api/auth/callback/google"

const GCP_CREDENTIALS_URL =
  "https://console.cloud.google.com/apis/credentials?project=egroup-392615"

console.log("=== verify:oauth-prod ===")
console.log(`Dominio prod: ${PRODUCTION_APP_ORIGIN}`)
console.log("")
console.log("GCP Console > APIs & Services > Credentials > OAuth 2.0 Client ID")
console.log(`  ${GCP_CREDENTIALS_URL}`)
console.log("")
console.log("Authorized JavaScript origins (agregar si faltan):")
console.log(`  - ${PRODUCTION_APP_ORIGIN}`)
console.log("  - http://localhost:3000")
console.log("")
console.log("Authorized redirect URIs (agregar si faltan):")
console.log(`  - ${GOOGLE_CALLBACK}`)
console.log(`  - ${LOCAL_CALLBACK}`)
console.log("")

const authUrl = process.env.AUTH_URL?.replace(/\/$/, "")
if (authUrl === PRODUCTION_APP_ORIGIN) {
  console.log(`AUTH_URL: OK (${authUrl})`)
} else if (!authUrl) {
  console.log("AUTH_URL: omitido en .env.local (OK en dev; en prod/Vercel usar:")
  console.log(`  AUTH_URL=${PRODUCTION_APP_ORIGIN})`)
} else {
  console.error(`AUTH_URL: debe ser ${PRODUCTION_APP_ORIGIN}, recibido ${authUrl}`)
  process.exit(1)
}

const googleId = process.env.AUTH_GOOGLE_ID?.trim()
if (!googleId || googleId === "your-google-client-id") {
  console.log("")
  console.log(
    "AVISO: AUTH_GOOGLE_ID aun es placeholder — tras configurar GCP, copia el Client ID a Vercel Environment Variables",
  )
} else {
  console.log(`AUTH_GOOGLE_ID: configurado (${googleId.slice(0, 12)}...)`)
}

console.log("")
console.log("verify:oauth-prod passed")
