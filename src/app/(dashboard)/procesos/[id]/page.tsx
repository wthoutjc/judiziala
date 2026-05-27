import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { mockProcesos, mockActuaciones } from "@/lib/mock-data"
import {
  MapPin,
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  ChevronLeft,
} from "lucide-react"
import Link from "next/link"

const estadoActuacionConfig = {
  completado: {
    node: "bg-[var(--success)] border-[var(--success)]",
    line: "bg-[var(--line)]",
    icon: <CheckCircle2 className="w-3 h-3 text-[oklch(0.99_0.004_250)]" />,
  },
  actual: {
    node: "bg-[var(--brand)] border-[var(--brand)] ring-4 ring-[var(--brand-soft)]",
    line: "bg-[var(--line)]",
    icon: <Circle className="w-3 h-3 text-[oklch(0.99_0.004_250)] fill-current" />,
  },
  pendiente: {
    node: "bg-[var(--surface)] border-[var(--line-strong)]",
    line: "bg-[var(--line)]",
    icon: <Clock className="w-3 h-3 text-[var(--ink-subtle)]" />,
  },
}

const procesoEstadoConfig = {
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
}

export default function ProcesoPage({ params }: { params: { id: string } }) {
  const proceso = mockProcesos.find((p) => p.id === params.id) ?? mockProcesos[0]
  const actuaciones = mockActuaciones.filter((a) => a.procesoId === proceso.id)
  const cfg = procesoEstadoConfig[proceso.estado as keyof typeof procesoEstadoConfig]

  const completadas = actuaciones.filter((a) => a.estado === "completado").length
  const pendientes = actuaciones.filter((a) => a.estado === "pendiente").length

  return (
    <>
      <Header title="Proceso" />
      <main className="flex-1 p-4 sm:p-6 max-w-[1280px] w-full">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] mb-5 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Volver al resumen
        </Link>

        {/* Process header */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] h-5 px-2 font-medium border ${cfg.className}`}
                >
                  {cfg.label}
                </Badge>
                <span className="text-xs text-[var(--ink-subtle)]">{proceso.jurisdiccion}</span>
              </div>
              <h2 className="text-base font-semibold text-[var(--ink)] mb-1">
                {proceso.partes.demandante}
                <span className="text-[var(--ink-subtle)] font-normal mx-2">vs.</span>
                {proceso.partes.demandado}
              </h2>
              <p className="font-mono text-sm text-[var(--ink-muted)] tabular">{proceso.radicado}</p>
            </div>
            <Link
              href="https://procesos.ramajudicial.gov.co"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--brand)] hover:text-[var(--brand-hover)] font-medium"
            >
              Ver en Rama Judicial <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5 pt-5 border-t border-[var(--line)]">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[var(--ink-subtle)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-[var(--ink-subtle)] uppercase tracking-wide mb-0.5">
                  Despacho
                </p>
                <p className="text-sm text-[var(--ink)]">{proceso.despacho}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Users className="w-4 h-4 text-[var(--ink-subtle)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-[var(--ink-subtle)] uppercase tracking-wide mb-0.5">
                  Partes
                </p>
                <p className="text-sm text-[var(--ink)]">{proceso.partes.demandante}</p>
                <p className="text-xs text-[var(--ink-muted)]">{proceso.partes.demandado}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-[var(--ink-subtle)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-[var(--ink-subtle)] uppercase tracking-wide mb-0.5">
                  Última actuación
                </p>
                <p className="text-sm text-[var(--ink)] tabular">{proceso.fechaUltimaActuacion}</p>
                <p className="text-xs text-[var(--ink-muted)]">{proceso.ultimaActuacion}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--ink)] mb-4">Timeline procesal</h3>
            <div className="relative">
              {actuaciones.map((actuacion, idx) => {
                const isLast = idx === actuaciones.length - 1
                const stateCfg =
                  estadoActuacionConfig[actuacion.estado as keyof typeof estadoActuacionConfig]

                return (
                  <div key={actuacion.id} className="flex gap-4">
                    {/* Node and line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${stateCfg.node}`}
                      >
                        {stateCfg.icon}
                      </div>
                      {!isLast && <div className={`w-px flex-1 min-h-[32px] ${stateCfg.line} mt-1`} />}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-7"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[var(--ink)]">
                              {actuacion.tipo}
                            </span>
                            {actuacion.estado === "actual" && (
                              <Badge className="text-[10px] h-4 px-1.5 bg-[var(--brand)] text-[oklch(0.99_0.004_250)] hover:bg-[var(--brand)] border-transparent">
                                Última actuación
                              </Badge>
                            )}
                            {actuacion.estado === "pendiente" && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 text-[var(--ink-subtle)] border-[var(--line-strong)] bg-transparent"
                              >
                                Pendiente
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
                            {actuacion.descripcion}
                          </p>
                        </div>
                        <span className="text-xs text-[var(--ink-subtle)] flex-shrink-0 mt-0.5 tabular">
                          {actuacion.fecha}
                        </span>
                      </div>

                      {actuacion.documentoId && actuacion.estado !== "pendiente" && (
                        <Link
                          href={`/documentos/${actuacion.documentoId}`}
                          className="inline-flex items-center gap-1.5 mt-2 text-xs text-[var(--brand)] hover:text-[var(--brand-hover)] font-medium"
                        >
                          <FileText className="w-3 h-3" />
                          Ver documento con resumen IA
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
              <h4 className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-4">
                Resumen del proceso
              </h4>
              <div className="space-y-2.5">
                {[
                  { label: "Total actuaciones", value: actuaciones.length },
                  { label: "Completadas", value: completadas },
                  { label: "Pendientes", value: pendientes },
                  { label: "Documentos IA", value: 5 },
                  { label: "Alertas activas", value: proceso.alertas },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-baseline">
                    <span className="text-xs text-[var(--ink-muted)]">{label}</span>
                    <span className="text-sm font-semibold text-[var(--ink)] tabular">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--warning-soft)] border border-[var(--warning-soft)] rounded-xl p-5">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[var(--warning-ink)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[var(--warning-ink)] mb-1">
                    Próxima fecha
                  </p>
                  <p className="text-xs text-[var(--warning-ink)]">
                    Audiencia de práctica de pruebas
                  </p>
                  <p className="text-sm font-bold text-[var(--warning-ink)] mt-1 tabular">
                    10 de mayo de 2024
                  </p>
                  <p className="text-[11px] text-[var(--warning-ink)] opacity-80 mt-0.5 tabular">
                    Faltan 5 días
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
