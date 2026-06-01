"use client"

import { isDemoMode } from "@/lib/demo-mode"
import { signIn } from "next-auth/react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Scale, PlayCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

// ── Auth error map ───────────────────────────────────────────────────────────

const AUTH_ERRORS: Record<string, string> = {
  OAuthSignin: "No se pudo iniciar el proceso de autenticación.",
  OAuthCallback: "Error en el callback de OAuth. Inténtalo de nuevo.",
  OAuthCreateAccount: "No se pudo crear la cuenta. Inténtalo de nuevo.",
  OAuthAccountNotLinked: "Esta cuenta ya está vinculada a otro proveedor.",
  SessionRequired: "Debes iniciar sesión para continuar.",
  AccessDenied: "Acceso denegado. Contacta al administrador.",
  Verification: "El enlace de verificación expiró o ya fue usado.",
}

const DEFAULT_ERROR = "Ocurrió un error al iniciar sesión. Inténtalo de nuevo."

// ── Error toast sub-component (needs Suspense for useSearchParams) ───────────

function ErrorToast() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const error = searchParams.get("error")
    if (!error) return
    const message = AUTH_ERRORS[error] ?? DEFAULT_ERROR
    toast.error(message, { duration: 5000, id: "auth-error" })
    // Remove ?error param from URL without reloading
    const clean = new URL(window.location.href)
    clean.searchParams.delete("error")
    router.replace(clean.pathname + (clean.search || ""), { scroll: false })
  }, [searchParams, router])

  return null
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  const handleSignIn = async (provider: string) => {
    setLoadingProvider(provider)
    await signIn(provider, { callbackUrl: "/dashboard" })
  }

  const handleDemo = async () => {
    setLoadingProvider("demo")
    await signIn("demo", { callbackUrl: "/dashboard" })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%), #F8FAFC",
      }}
    >
      {/* Suspense boundary for searchParams */}
      <Suspense>
        <ErrorToast />
      </Suspense>

      {/* Back link */}
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center gap-2 transition-colors duration-150"
        style={{ color: "#64748B" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#0F172A")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#64748B")}
      >
        <Scale className="w-4 h-4" />
        <span className="text-sm font-medium">Judiziala</span>
      </Link>

      <div className="w-full max-w-[380px]">
        {/* ── Card ── */}
        <div
          className="rounded-2xl p-8"
          style={{
            border: "1px solid rgba(15,23,42,0.09)",
            background: "#FFFFFF",
            backdropFilter: "none",
            boxShadow: "0 4px 6px rgba(15,23,42,0.04), 0 24px 64px rgba(15,23,42,0.10)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "#6366F1",
                boxShadow: "0 0 16px rgba(99,102,241,0.35)",
              }}
            >
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-sm" style={{ color: "#0F172A" }}>
              Judiziala
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "#0F172A", letterSpacing: "-0.025em" }}
            >
              Tus procesos, vigilados.
            </h1>
            <p className="text-sm" style={{ color: "#475569", lineHeight: 1.6 }}>
              Entra con tu cuenta corporativa para ver actuaciones, autos y términos al día.
            </p>
          </div>

          {/* Google */}
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              border: "1px solid rgba(15,23,42,0.12)",
              background: "#F8FAFC",
              color: "#334155",
              transition: "border-color 200ms cubic-bezier(0.25,1,0.5,1), background 200ms, color 200ms",
            }}
            onMouseEnter={(e) => {
              if (!loadingProvider) {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = "rgba(15,23,42,0.20)"
                el.style.background = "#F1F5F9"
                el.style.color = "#0F172A"
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = "rgba(15,23,42,0.12)"
              el.style.background = "#F8FAFC"
              el.style.color = "#334155"
            }}
            onClick={() => handleSignIn("google")}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === "google" ? (
              <div
                className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: "rgba(255,255,255,0.15)", borderTopColor: "#818CF8" }}
              />
            ) : (
              /* Google SVG icon */
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continuar con Google
          </button>

          {/* Demo mode */}
          {isDemoMode() && (
            <div
              className="mt-6 pt-6"
              style={{ borderTop: "1px solid rgba(148,163,184,0.10)" }}
            >
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: "#818CF8",
                  transition: "background 200ms cubic-bezier(0.25,1,0.5,1), color 200ms",
                }}
                onMouseEnter={(e) => {
                  if (!loadingProvider) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = "rgba(99,102,241,0.08)"
                    el.style.color = "#A5B4FC"
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = "transparent"
                  el.style.color = "#818CF8"
                }}
                onClick={handleDemo}
                disabled={loadingProvider !== null}
              >
                {loadingProvider === "demo" ? (
                  <div
                    className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: "rgba(129,140,248,0.25)", borderTopColor: "#818CF8" }}
                  />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                Explorar demo sin cuenta
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-center mt-6" style={{ color: "#94A3B8", lineHeight: 1.6 }}>
          Al continuar aceptas los{" "}
          <a
            href="#"
            className="underline underline-offset-2 transition-colors duration-150"
            style={{ color: "#64748B" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#6366F1")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#64748B")}
          >
            términos
          </a>{" "}
          y la{" "}
          <a
            href="#"
            className="underline underline-offset-2 transition-colors duration-150"
            style={{ color: "#64748B" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#6366F1")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#64748B")}
          >
            política de privacidad
          </a>
          .
        </p>
      </div>
    </div>
  )
}
