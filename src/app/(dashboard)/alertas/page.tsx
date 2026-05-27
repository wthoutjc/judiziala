"use client"

import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { mockAlertas } from "@/lib/mock-data"
import { useState } from "react"
import { AlertTriangle, Info, Clock, CheckCheck, Filter, Bell } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

type Filtro = "todas" | "urgente" | "advertencia" | "info" | "no_leidas"

const alertaConfig = {
  urgente: {
    icon: AlertTriangle,
    iconColor: "text-[var(--danger)]",
    iconBg: "bg-[var(--danger-soft)]",
    badgeClass: "bg-[var(--danger-soft)] text-[var(--danger-ink)] border-[var(--danger-soft)]",
    label: "Urgente",
  },
  info: {
    icon: Info,
    iconColor: "text-[var(--info)]",
    iconBg: "bg-[var(--info-soft)]",
    badgeClass: "bg-[var(--info-soft)] text-[var(--info-ink)] border-[var(--info-soft)]",
    label: "Información",
  },
  advertencia: {
    icon: Clock,
    iconColor: "text-[var(--warning-ink)]",
    iconBg: "bg-[var(--warning-soft)]",
    badgeClass: "bg-[var(--warning-soft)] text-[var(--warning-ink)] border-[var(--warning-soft)]",
    label: "Advertencia",
  },
}

export default function AlertasPage() {
  const [filtro, setFiltro] = useState<Filtro>("todas")
  const [alertas, setAlertas] = useState(mockAlertas)

  const alertasFiltradas = alertas.filter((a) => {
    if (filtro === "no_leidas") return !a.leida
    if (filtro === "todas") return true
    return a.tipo === filtro
  })

  const marcarLeida = (id: string) => {
    setAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, leida: true } : a)))
  }

  const marcarTodasLeidas = () => {
    setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })))
  }

  const noLeidas = alertas.filter((a) => !a.leida).length

  const filtros: { key: Filtro; label: string; count?: number }[] = [
    { key: "todas", label: "Todas", count: alertas.length },
    { key: "no_leidas", label: "Sin leer", count: noLeidas },
    { key: "urgente", label: "Urgentes", count: alertas.filter((a) => a.tipo === "urgente").length },
    {
      key: "advertencia",
      label: "Advertencias",
      count: alertas.filter((a) => a.tipo === "advertencia").length,
    },
    { key: "info", label: "Información", count: alertas.filter((a) => a.tipo === "info").length },
  ]

  return (
    <>
      <Header title="Alertas" />
      <main className="flex-1 p-6 max-w-[1280px] w-full">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[var(--ink-muted)]" />
            <span className="text-sm text-[var(--ink-muted)]">
              {noLeidas > 0 ? (
                <>
                  <span className="font-semibold text-[var(--ink)] tabular">{noLeidas}</span> alertas sin leer
                </>
              ) : (
                "Todo al día"
              )}
            </span>
          </div>
          {noLeidas > 0 && (
            <button
              onClick={marcarTodasLeidas}
              className="flex items-center gap-1.5 text-xs text-[var(--brand)] hover:text-[var(--brand-hover)] font-medium transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-5 bg-[var(--sunken)] rounded-lg p-1 w-fit">
          {filtros.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                filtro === f.key
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              )}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span
                  className={cn(
                    "min-w-[16px] h-4 px-1 rounded-full text-[9px] font-semibold flex items-center justify-center tabular",
                    f.key === "urgente"
                      ? "bg-[var(--danger-soft)] text-[var(--danger-ink)]"
                      : "bg-[var(--line)] text-[var(--ink-muted)]"
                  )}
                >
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Alertas list */}
        <div className="space-y-2">
          {alertasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-[var(--sunken)] rounded-full flex items-center justify-center mb-3">
                <Filter className="w-5 h-5 text-[var(--ink-subtle)]" />
              </div>
              <p className="text-sm font-medium text-[var(--ink-muted)]">
                Sin alertas en esta categoría
              </p>
            </div>
          ) : (
            alertasFiltradas.map((alerta) => {
              const cfg = alertaConfig[alerta.tipo as keyof typeof alertaConfig]
              const Icon = cfg.icon
              return (
                <div
                  key={alerta.id}
                  className={cn(
                    "rounded-xl border transition-all p-4",
                    alerta.leida
                      ? "bg-[var(--surface)] border-[var(--line)] opacity-70"
                      : "bg-[var(--surface)] border-[var(--line-strong)]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}
                    >
                      <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={cn(
                                "text-sm font-semibold text-[var(--ink)]",
                                alerta.leida && "font-medium"
                              )}
                            >
                              {alerta.titulo}
                            </span>
                            {!alerta.leida && (
                              <span
                                aria-label="Sin leer"
                                className="w-1.5 h-1.5 bg-[var(--brand)] rounded-full flex-shrink-0"
                              />
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] h-4 px-1.5 font-medium border ${cfg.badgeClass}`}
                            >
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                            {alerta.descripcion}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Link
                              href={`/procesos/${alerta.procesoId}`}
                              className="text-xs text-[var(--brand)] hover:underline font-mono tabular"
                            >
                              {alerta.proceso.slice(0, 14)}...
                            </Link>
                            <span className="text-xs text-[var(--ink-subtle)] tabular">
                              {formatDistanceToNow(new Date(alerta.timestamp), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>
                          </div>
                        </div>
                        {!alerta.leida && (
                          <button
                            onClick={() => marcarLeida(alerta.id)}
                            className="flex-shrink-0 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Leída</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </>
  )
}
