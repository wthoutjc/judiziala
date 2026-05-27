import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockProcesos, mockAlertas } from "@/lib/mock-data"
import {
  ArrowRight,
  AlertTriangle,
  Info,
  Clock,
  ChevronRight,
  CircleDot,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

const estadoConfig = {
  activo: {
    label: "Activo",
    className: "bg-[var(--success-soft)] text-[var(--success-ink)] border-[var(--success-soft)]",
  },
  en_despacho: {
    label: "En despacho",
    className: "bg-[var(--info-soft)] text-[var(--info-ink)] border-[var(--info-soft)]",
  },
  urgente: {
    label: "Urgente",
    className: "bg-[var(--danger-soft)] text-[var(--danger-ink)] border-[var(--danger-soft)]",
  },
  suspendido: {
    label: "Suspendido",
    className: "bg-[var(--warning-soft)] text-[var(--warning-ink)] border-[var(--warning-soft)]",
  },
  archivado: {
    label: "Archivado",
    className: "bg-[var(--sunken)] text-[var(--ink-subtle)] border-[var(--line)]",
  },
}

const alertaTipoConfig = {
  urgente: {
    icon: AlertTriangle,
    iconColor: "text-[var(--danger)]",
    dotColor: "bg-[var(--danger)]",
  },
  info: {
    icon: Info,
    iconColor: "text-[var(--info)]",
    dotColor: "bg-[var(--info)]",
  },
  advertencia: {
    icon: Clock,
    iconColor: "text-[var(--warning-ink)]",
    dotColor: "bg-[var(--warning)]",
  },
}

export default function DashboardPage() {
  const procesosUrgentes = mockProcesos.filter((p) => p.estado === "urgente" || p.alertas > 0)
  const alertasNoLeidas = mockAlertas.filter((a) => !a.leida)
  const urgentesCount = alertasNoLeidas.filter((a) => a.tipo === "urgente").length

  const hoy = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <>
      <Header title="Resumen" />
      <main className="flex-1 p-4 sm:p-6 max-w-[1280px] w-full">
        {/* Command strip: narrative summary, not a hero-metric grid */}
        <section className="mb-6">
          <p className="text-xs text-[var(--ink-subtle)] capitalize tabular">{hoy}</p>
          <h2 className="text-[22px] leading-tight font-semibold text-[var(--ink)] mt-1 max-w-2xl">
            Buenas tardes, Juan.{" "}
            <span className="text-[var(--ink-muted)] font-normal">
              Hay{" "}
              <span className="text-[var(--ink)] font-semibold tabular">8 actuaciones nuevas</span> en{" "}
              <span className="text-[var(--ink)] font-semibold tabular">5 procesos</span> hoy.
              {urgentesCount > 0 && (
                <>
                  {" "}
                  <span className="text-[var(--danger-ink)] font-semibold tabular">
                    {urgentesCount}
                  </span>{" "}
                  requieren atención inmediata.
                </>
              )}
            </span>
          </h2>

          <div className="flex items-center gap-4 sm:gap-5 mt-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
              <span className="text-[var(--ink-muted)]">
                <span className="font-semibold text-[var(--ink)] tabular">23</span> procesos activos
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              <span className="text-[var(--ink-muted)]">
                <span className="font-semibold text-[var(--ink)] tabular">147</span> documentos analizados
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
              <span className="text-[var(--ink-muted)]">
                <span className="font-semibold text-[var(--ink)] tabular">3</span> términos esta semana
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Procesos críticos */}
          <Card className="lg:col-span-2 border-[var(--line)] shadow-none bg-[var(--surface)]">
            <CardHeader className="pb-3 px-5 pt-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-[var(--ink)]">
                  Necesitan tu atención
                </CardTitle>
                <p className="text-xs text-[var(--ink-subtle)] mt-0.5">
                  Procesos con alertas activas o cambios recientes
                </p>
              </div>
              <Link
                href="/procesos"
                className="flex items-center gap-1 text-xs text-[var(--brand)] hover:text-[var(--brand-hover)] font-medium"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="divide-y divide-[var(--line)]">
                {procesosUrgentes.map((proceso) => {
                  const cfg = estadoConfig[proceso.estado as keyof typeof estadoConfig]
                  return (
                    <Link
                      key={proceso.id}
                      href={`/procesos/${proceso.id}`}
                      className="flex items-start justify-between px-5 py-3.5 hover:bg-[var(--sunken)] transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-[var(--ink-subtle)] truncate tabular">
                            {proceso.radicado.slice(0, 16)}...
                          </span>
                          {proceso.alertas > 0 && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] text-[var(--danger-ink)] font-semibold tabular">
                              <CircleDot className="w-2.5 h-2.5 fill-current" />
                              {proceso.alertas}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-[var(--ink)] truncate">
                          {proceso.partes.demandante}
                        </p>
                        <p className="text-xs text-[var(--ink-muted)] truncate mt-0.5">
                          {proceso.despacho}
                        </p>
                        <p className="text-xs text-[var(--ink-subtle)] mt-1.5">
                          {proceso.ultimaActuacion}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 px-2 font-medium border ${cfg.className}`}
                        >
                          {cfg.label}
                        </Badge>
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--line-strong)] group-hover:text-[var(--brand)] transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Alertas recientes */}
          <Card className="border-[var(--line)] shadow-none bg-[var(--surface)]">
            <CardHeader className="pb-3 px-5 pt-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-[var(--ink)]">
                  Últimas alertas
                </CardTitle>
                <p className="text-xs text-[var(--ink-subtle)] mt-0.5 tabular">
                  {alertasNoLeidas.length} sin leer
                </p>
              </div>
              <Link
                href="/alertas"
                className="flex items-center gap-1 text-xs text-[var(--brand)] hover:text-[var(--brand-hover)] font-medium"
              >
                Centro <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {alertasNoLeidas.slice(0, 4).map((alerta) => {
                const cfg = alertaTipoConfig[alerta.tipo as keyof typeof alertaTipoConfig]
                const Icon = cfg.icon
                return (
                  <Link
                    key={alerta.id}
                    href="/alertas"
                    className="flex items-start gap-2.5 -mx-2 px-2 py-1.5 rounded-md hover:bg-[var(--sunken)] transition-colors"
                  >
                    <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--ink)] leading-tight">
                        {alerta.titulo}
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 leading-snug line-clamp-2">
                        {alerta.descripcion}
                      </p>
                      <p className="text-[10px] text-[var(--ink-subtle)] mt-1 tabular">
                        {formatDistanceToNow(new Date(alerta.timestamp), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Todos los procesos */}
        <Card className="border-[var(--line)] shadow-none bg-[var(--surface)]">
          <CardHeader className="pb-3 px-5 pt-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[var(--ink)]">
              Todos los procesos
            </CardTitle>
            <span className="text-xs text-[var(--ink-subtle)] tabular">
              {mockProcesos.length} procesos
            </span>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="divide-y divide-[var(--line)]">
              {mockProcesos.map((proceso) => {
                const cfg = estadoConfig[proceso.estado as keyof typeof estadoConfig]
                return (
                  <Link
                    key={proceso.id}
                    href={`/procesos/${proceso.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-[var(--sunken)] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-mono text-[var(--ink-subtle)] tabular">
                        {proceso.radicado.slice(0, 14)}...
                      </span>
                      <p className="text-sm font-medium text-[var(--ink)] truncate mt-0.5">
                        {proceso.partes.demandante}{" "}
                        <span className="text-[var(--ink-subtle)] font-normal">vs.</span>{" "}
                        {proceso.partes.demandado}
                      </p>
                      <p className="text-xs text-[var(--ink-muted)] truncate">{proceso.despacho}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <span className="hidden sm:block text-xs text-[var(--ink-subtle)] tabular">
                        {proceso.fechaUltimaActuacion}
                      </span>
                      <Badge variant="outline" className={`text-[10px] h-5 px-2 font-medium border ${cfg.className}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
