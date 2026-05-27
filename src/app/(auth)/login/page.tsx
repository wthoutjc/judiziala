"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Scale, Globe, GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  const handleSignIn = async (provider: string) => {
    setLoadingProvider(provider)
    await signIn(provider, { callbackUrl: "/dashboard" })
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-8 h-8 bg-[var(--brand)] rounded-lg flex items-center justify-center">
            <Scale className="w-4 h-4 text-[oklch(0.99_0.004_250)]" />
          </div>
          <span className="font-semibold text-[var(--ink)] tracking-tight">Judiziala</span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-[28px] leading-[1.15] font-semibold text-[var(--ink)] tracking-tight">
            Tus procesos, vigilados.
          </h1>
          <p className="text-sm text-[var(--ink-muted)] mt-2 leading-relaxed">
            Entra con tu cuenta corporativa para ver actuaciones, autos y términos al día.
          </p>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-2.5">
          <Button
            variant="outline"
            className="w-full h-10 border-[var(--line-strong)] bg-[var(--surface)] hover:bg-[var(--sunken)] text-[var(--ink)] font-medium text-sm gap-3 cursor-pointer justify-start px-4"
            onClick={() => handleSignIn("google")}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === "google" ? (
              <div className="w-4 h-4 border-2 border-[var(--line-strong)] border-t-[var(--brand)] rounded-full animate-spin" />
            ) : (
              <Globe className="w-4 h-4 text-[var(--ink-muted)]" />
            )}
            <span>Continuar con Google</span>
          </Button>

          <Button
            variant="outline"
            className="w-full h-10 border-[var(--line-strong)] bg-[var(--surface)] hover:bg-[var(--sunken)] text-[var(--ink)] font-medium text-sm gap-3 cursor-pointer justify-start px-4"
            onClick={() => handleSignIn("github")}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === "github" ? (
              <div className="w-4 h-4 border-2 border-[var(--line-strong)] border-t-[var(--brand)] rounded-full animate-spin" />
            ) : (
              <GitBranch className="w-4 h-4 text-[var(--ink-muted)]" />
            )}
            <span>Continuar con GitHub</span>
          </Button>
        </div>

        {/* Demo entry */}
        <div className="mt-6 pt-6 border-t border-[var(--line)]">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="text-sm text-[var(--brand)] hover:text-[var(--brand-hover)] font-medium transition-colors"
          >
            Explorar demo sin cuenta &rarr;
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-[var(--ink-subtle)] mt-10 leading-relaxed">
          Al continuar aceptas los{" "}
          <a href="#" className="underline hover:text-[var(--ink-muted)]">
            términos
          </a>{" "}
          y la{" "}
          <a href="#" className="underline hover:text-[var(--ink-muted)]">
            política de privacidad
          </a>
          .
        </p>
      </div>
    </div>
  )
}
