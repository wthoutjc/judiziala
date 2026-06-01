"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Scale } from "lucide-react"

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        transition: "background 300ms cubic-bezier(0.25,1,0.5,1), border-color 300ms cubic-bezier(0.25,1,0.5,1)",
        background: scrolled ? "rgba(248,250,252,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(15,23,42,0.08)" : "1px solid transparent",
      }}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "#6366F1",
              transition: "background 200ms cubic-bezier(0.25,1,0.5,1)",
              boxShadow: "0 0 12px rgba(99,102,241,0.35)",
            }}
          >
            <Scale className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-slate-900 tracking-tight text-sm">Judiziala</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/#features"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors duration-150"
          >
            Características
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors duration-150"
          >
            Precios
          </Link>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors duration-150 px-3 py-1.5"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-white px-4 py-2 rounded-lg"
            style={{
              background: "#6366F1",
              boxShadow: "0 0 16px rgba(99,102,241,0.25)",
              transition: "background 200ms cubic-bezier(0.25,1,0.5,1), box-shadow 200ms cubic-bezier(0.25,1,0.5,1)",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = "#818CF8"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = "#6366F1"
            }}
          >
            Comenzar gratis
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-slate-600 hover:text-slate-900 transition-colors p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 py-4 flex flex-col gap-1"
          style={{
            background: "rgba(248,250,252,0.97)",
            backdropFilter: "blur(20px) saturate(180%)",
            borderBottom: "1px solid rgba(15,23,42,0.08)",
          }}
        >
          <Link
            href="/#features"
            className="text-sm text-slate-600 hover:text-slate-900 py-2.5 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Características
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-slate-600 hover:text-slate-900 py-2.5 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Precios
          </Link>
          <div className="pt-3 mt-1 border-t border-slate-700/40 flex flex-col gap-2">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 py-2.5 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-white text-center py-2.5 rounded-xl"
              style={{ background: "#6366F1" }}
              onClick={() => setMenuOpen(false)}
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
