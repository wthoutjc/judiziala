import "server-only"

import { z } from "zod"
import { PRODUCTION_APP_ORIGIN } from "@/lib/auth/oauth-prod"

const appUrl = z
  .string()
  .url()
  .transform((value) => value.replace(/\/$/, ""))

const prodAuthUrl = appUrl.refine(
  (value) => {
    if (process.env.NODE_ENV !== "production") return true
    return value === PRODUCTION_APP_ORIGIN
  },
  {
    message: `En produccion AUTH_URL debe ser ${PRODUCTION_APP_ORIGIN}`,
  },
)

const postgresUrl = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value.startsWith("postgresql://") || value.startsWith("postgres://"),
    { message: "Debe ser una URL de conexion PostgreSQL" },
  )
  .refine((value) => !value.includes("YOUR_SUPABASE_DB_PASSWORD"), {
    message:
      "Reemplaza YOUR_SUPABASE_DB_PASSWORD en .env.local (Supabase > Database)",
  })

const prodDatabaseUrl = postgresUrl.refine(
  (value) => {
    if (process.env.NODE_ENV !== "production") return true
    try {
      const url = new URL(value.replace(/^postgres:\/\//, "postgresql://"))
      return (
        url.port === "6543" &&
        url.searchParams.get("pgbouncer") === "true" &&
        url.hostname.includes("pooler.supabase.com")
      )
    } catch {
      return false
    }
  },
  {
    message:
      "En produccion DATABASE_URL debe usar pooler Supabase :6543 con pgbouncer=true",
  },
)

const prodDirectUrl = postgresUrl.refine(
  (value) => {
    if (process.env.NODE_ENV !== "production") return true
    try {
      const url = new URL(value.replace(/^postgres:\/\//, "postgresql://"))
      return url.port === "5432"
    } catch {
      return false
    }
  },
  {
    message: "En produccion DIRECT_URL debe usar puerto :5432 (session/direct)",
  },
)

const envSchema = z
  .object({
    DATABASE_URL: prodDatabaseUrl,
    DIRECT_URL: prodDirectUrl,
    AUTH_URL: prodAuthUrl.optional(),
    AUTH_SECRET: z.string().min(16),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_DEMO_MODE: z.enum(["true", "false"]).optional(),
    CPNU_BASE_URL: z.string().url().optional(),
    CPNU_MAX_RPS: z.coerce.number().int().positive().optional(),
    CPNU_CIRCUIT_FAILURE_THRESHOLD: z.coerce.number().int().positive().optional(),
    CPNU_CIRCUIT_COOLDOWN_MS: z.coerce.number().int().positive().optional(),
    CPNU_USER_RL_MAX: z.coerce.number().int().positive().optional(),
    CPNU_USER_RL_WINDOW_MS: z.coerce.number().int().positive().optional(),
    CPNU_METRICS_ENABLED: z.enum(["true", "false"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      process.env.NODE_ENV === "production" &&
      !data.AUTH_URL?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_URL"],
        message: `Requerido en produccion (${PRODUCTION_APP_ORIGIN})`,
      })
    }

    if (
      process.env.NODE_ENV === "production" &&
      data.NEXT_PUBLIC_DEMO_MODE === "true"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_DEMO_MODE"],
        message: "NEXT_PUBLIC_DEMO_MODE no puede estar activo en produccion",
      })
      return
    }

    if (data.NEXT_PUBLIC_DEMO_MODE === "true") {
      return
    }

    if (!data.AUTH_GOOGLE_ID?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_GOOGLE_ID"],
        message: "Requerido cuando NEXT_PUBLIC_DEMO_MODE no es true",
      })
    }

    if (!data.AUTH_GOOGLE_SECRET?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_GOOGLE_SECRET"],
        message: "Requerido cuando NEXT_PUBLIC_DEMO_MODE no es true",
      })
    }

    if (!data.ANTHROPIC_API_KEY?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["ANTHROPIC_API_KEY"],
        message: "Requerido cuando NEXT_PUBLIC_DEMO_MODE no es true",
      })
    }
  })

function parseEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors
    console.error("Variables de entorno invalidas (.env.local):", formatted)
    throw new Error("Configuracion de entorno invalida")
  }

  return result.data
}

export const env = parseEnv()

export type ServerEnv = z.infer<typeof envSchema>
