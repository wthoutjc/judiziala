"use client"

import { Header } from "@/components/layout/header"
import { useState, useEffect, useCallback } from "react"
import { signOut } from "next-auth/react"
import {
  Monitor,
  Smartphone,
  Clock,
  ShieldCheck,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Hash,
} from "lucide-react"
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

// Tipos definidos localmente: current-session.ts es server-only
type SessionData = {
  device: string | null
  ipHash: string | null
  lastSeenAt: string
  expires: string
}

type UIState =
  | { status: "loading" }
  | { status: "ok"; data: SessionData }
  | { status: "error" }

function getDeviceIcon(device: string | null) {
  if (!device) return Monitor
  const d = device.toLowerCase()
  if (
    d.includes("mobile") ||
    d.includes("android") ||
    d.includes("iphone") ||
    d.includes("ios")
  )
    return Smartphone
  return Monitor
}

function formatExpiry(iso: string): string {
  const date = new Date(iso)
  const time = format(date, "HH:mm")
  if (isToday(date)) return `hoy a las ${time}`
  if (isTomorrow(date)) return `mañana a las ${time}`
  return format(date, "d MMM, HH:mm", { locale: es })
}

export default function SesionesPage() {
  const [state, setState] = useState<UIState>({ status: "loading" })
  const [confirming, setConfirming] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const loadSession = useCallback(() => {
    setState({ status: "loading" })
    fetch("/api/session")
      .then(async (res) => {
        if (!res.ok) throw new Error("unauthorized")
        const data: SessionData = await res.json()
        setState({ status: "ok", data })
      })
      .catch(() => setState({ status: "error" }))
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/session/logout-all", { method: "POST" })
    } finally {
      await signOut({ callbackUrl: "/login" })
    }
  }

  return (
    <>
      <Header title="Configuración" />
      <main className="flex-1 p-4 sm:p-6 max-w-[680px] w-full">
        {/* ── Sesión activa ────────────────────────────────────── */}
        <section className="pb-6 border-b border-[var(--line)]">
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-wider uppercase text-[var(--ink-subtle)] mb-1">
              Sesión activa
            </h2>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
              Solo hay una sesión activa a la vez. Al iniciar sesión en otro dispositivo, esta se
              cierra automáticamente.
            </p>
          </div>

          {state.status === "loading" && <SkeletonCard />}

          {state.status === "error" && (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--warning-soft)] flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-[var(--warning-ink)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--ink)]">
                  No se pudo cargar la sesión
                </p>
                <p className="text-sm text-[var(--ink-muted)] mt-0.5">
                  Verifica tu conexión y vuelve a intentarlo.
                </p>
                <button
                  onClick={loadSession}
                  className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {state.status === "ok" && <SessionCard data={state.data} />}
        </section>

        {/* ── Seguridad ─────────────────────────────────────────── */}
        <section className="pt-6">
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-wider uppercase text-[var(--ink-subtle)] mb-1">
              Seguridad
            </h2>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
              Cierra la sesión actual y cualquier sesión residual. Deberás iniciar sesión de nuevo
              para continuar.
            </p>
          </div>

          {confirming ? (
            <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4">
              <p className="text-sm text-[var(--danger-ink)] mb-3 leading-relaxed">
                Se cerrará tu sesión activa de inmediato. ¿Confirmas?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={loggingOut}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--danger)] text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loggingOut ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Cerrando sesión...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      Cerrar sesión
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión en todos los dispositivos
            </button>
          )}
        </section>
      </main>
    </>
  )
}

function SessionCard({ data }: { data: SessionData }) {
  const DeviceIcon = getDeviceIcon(data.device)
  const isDemo = data.device === "Demo"

  const fields: {
    label: string
    value: string
    icon: React.ElementType
    mono?: boolean
    title?: string
  }[] = [
    {
      label: "Última actividad",
      value: formatDistanceToNow(new Date(data.lastSeenAt), { addSuffix: true, locale: es }),
      icon: Clock,
    },
    {
      label: "Expira",
      value: formatExpiry(data.expires),
      icon: ShieldCheck,
    },
    ...(data.ipHash
      ? [
          {
            label: "Huella de red",
            value: data.ipHash.slice(0, 8) + "…",
            icon: Hash,
            mono: true,
            title:
              "No almacenamos tu dirección IP. Esta huella se deriva de ella para detectar cambios de red.",
          },
        ]
      : []),
  ]

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
      {/* Fila principal: dispositivo + badge */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-9 h-9 rounded-lg bg-[var(--sunken)] flex items-center justify-center flex-shrink-0">
          <DeviceIcon className="w-4 h-4 text-[var(--ink-muted)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--ink)] truncate">
            {isDemo ? "Sesión de demostración" : (data.device ?? "Dispositivo desconocido")}
          </p>
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--success-soft)] text-[var(--success-ink)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block" />
          Activa
        </span>
      </div>

      {/* Filas de metadatos */}
      <div className="border-t border-[var(--line)]">
        {fields.map((field) => {
          const Icon = field.icon
          return (
            <div
              key={field.label}
              className="flex items-center gap-3 px-5 py-3 border-b border-[var(--line)] last:border-b-0"
            >
              <Icon className="w-3.5 h-3.5 text-[var(--ink-subtle)] flex-shrink-0" />
              <span className="text-xs text-[var(--ink-subtle)] w-32 flex-shrink-0">
                {field.label}
              </span>
              <span
                className={cn(
                  "text-sm text-[var(--ink-muted)] min-w-0",
                  field.mono && "font-mono text-xs tracking-wider text-[var(--ink-subtle)]"
                )}
                title={field.title}
              >
                {field.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      aria-label="Cargando sesión"
      className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden animate-pulse"
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-9 h-9 rounded-lg bg-[var(--sunken)]" />
        <div className="flex-1">
          <div className="h-3.5 bg-[var(--sunken)] rounded-md w-44" />
        </div>
        <div className="h-6 w-16 bg-[var(--sunken)] rounded-full" />
      </div>
      <div className="border-t border-[var(--line)]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-5 py-3 border-b border-[var(--line)] last:border-b-0"
          >
            <div className="w-3.5 h-3.5 bg-[var(--sunken)] rounded" />
            <div className="w-32 h-3 bg-[var(--sunken)] rounded-md" />
            <div
              className={cn(
                "h-3 bg-[var(--sunken)] rounded-md",
                i === 0 ? "w-28" : i === 1 ? "w-24" : "w-20"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
