import { config } from "dotenv"
import { readFileSync } from "node:fs"

config({ path: ".env.local", override: true, quiet: true })

const directUrl = process.env.DIRECT_URL?.trim()

if (!directUrl) {
  console.error("DIRECT_URL no definida en .env.local")
  process.exit(1)
}

console.log("=== GitHub Actions: secret DIRECT_URL ===")
console.log("")
console.log("Repo: https://github.com/wthoutjc/judiziala/settings/secrets/actions")
console.log("")
console.log("1. New repository secret")
console.log("2. Name: DIRECT_URL")
console.log("3. Value: (copiar DIRECT_URL de .env.local o Vercel)")
console.log("")
console.log("Prefijo (verificar en .env.local):", directUrl.slice(0, 40) + "...")
console.log("")
console.log("Tras crear el secret, push a main o ejecutar workflow_dispatch en:")
console.log("  Actions > Prisma migrate deploy > Run workflow")
