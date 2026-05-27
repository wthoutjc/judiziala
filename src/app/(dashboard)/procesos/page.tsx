import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { mockProcesos } from "@/lib/mock-data"
import { FolderOpen, ChevronRight, AlertTriangle, Plus, Search } from "lucide-react"
import Link from "next/link"

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

export default function ProcesosPage() {
  return (
    <>
      <Header title="Procesos" />
      <main className="flex-1 p-4 sm:p-6 max-w-[1280px] w-full">
        <div className="flex items-center justify-between mb-5 gap-4">
          <div>
            <p className="text-sm text-[var(--ink-muted)]">
              <span className="font-semibold text-[var(--ink)] tabular">{mockProcesos.length}</span>{" "}
              procesos monitoreados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden md:flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--ink-subtle)] hover:border-[var(--line-strong)] transition-colors">
              <Search className="w-3.5 h-3.5" />
              Buscar
            </button>
            <button className="flex items-center gap-2 h-9 px-4 bg-[var(--brand)] text-[oklch(0.99_0.004_250)] text-xs font-medium rounded-md hover:bg-[var(--brand-hover)] transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Agregar proceso
            </button>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
          <div className="divide-y divide-[var(--line)]">
            {mockProcesos.map((proceso) => {
              const cfg = estadoConfig[proceso.estado as keyof typeof estadoConfig]
              return (
                <Link
                  key={proceso.id}
                  href={`/procesos/${proceso.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[var(--sunken)] transition-colors group"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-9 h-9 bg-[var(--brand-soft)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-4 h-4 text-[var(--brand-ink)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-[var(--ink-subtle)] tabular">
                          {proceso.radicado.slice(0, 18)}...
                        </span>
                        {proceso.alertas > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--danger-ink)] font-semibold tabular">
                            <AlertTriangle className="w-3 h-3" />
                            {proceso.alertas} alerta{proceso.alertas > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-[var(--ink)] truncate">
                        {proceso.partes.demandante}{" "}
                        <span className="text-[var(--ink-subtle)] font-normal">vs.</span>{" "}
                        {proceso.partes.demandado}
                      </p>
                      <p className="text-xs text-[var(--ink-muted)] truncate mt-0.5">
                        {proceso.despacho}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] text-[var(--ink-subtle)] uppercase tracking-wide">
                        Última actuación
                      </p>
                      <p className="text-xs font-medium text-[var(--ink-muted)] tabular">
                        {proceso.fechaUltimaActuacion}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 px-2 font-medium border ${cfg.className}`}
                    >
                      {cfg.label}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-[var(--line-strong)] group-hover:text-[var(--brand)] transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </>
  )
}
