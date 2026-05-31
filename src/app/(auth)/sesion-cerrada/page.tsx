"use client"

import Link from "next/link"
import { useEffect } from "react"
import { LogIn, Scale, ShieldOff } from "lucide-react"
import { signOut } from "next-auth/react"

export default function SesionCerradaPage() {
  useEffect(() => {
    void signOut({ redirect: false })
  }, [])

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-8 h-8 bg-[var(--brand)] rounded-lg flex items-center justify-center">
            <Scale className="w-4 h-4 text-[oklch(0.99_0.004_250)]" />
          </div>
          <span className="font-semibold text-[var(--ink)] tracking-tight">
            Judiziala
          </span>
        </div>

        <div className="mb-8">
          <div className="w-10 h-10 rounded-lg bg-[var(--sunken)] flex items-center justify-center mb-4">
            <ShieldOff className="w-5 h-5 text-[var(--ink-muted)]" />
          </div>
          <h1 className="text-[28px] leading-[1.15] font-semibold text-[var(--ink)] tracking-tight">
            Sesión cerrada
          </h1>
          <p className="text-sm text-[var(--ink-muted)] mt-2 leading-relaxed">
            Tu sesión se cerró porque iniciaste en otro dispositivo.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[oklch(0.99_0.004_250)] font-medium text-sm"
        >
          <LogIn className="w-4 h-4" />
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  )
}
