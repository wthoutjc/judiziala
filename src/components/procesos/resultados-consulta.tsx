"use client"

import { Search, Lock } from "lucide-react"
import type { PaginacionConsulta } from "@/app/(dashboard)/procesos/actions.types"
import { formatearRadicado as formatearRadicadoDisplay, formatFechaJudicial } from "@/lib/judicial/display"
import type { Proceso } from "@/lib/judicial/model"
import { findSujetoPorRol } from "@/lib/judicial/model"
import { cn } from "@/lib/utils"

export { formatearRadicadoDisplay as formatearRadicado }

function formatFecha(iso: string): string {
  return formatFechaJudicial(iso)
}

// ─── Types ──────────────────────────────────────────────────────────────────

type Props = {
  procesos: Proceso[]
  seleccionado: number | null
  onSeleccionar: (id: number) => void
  paginacion?: PaginacionConsulta | null
  onVerMas?: () => void
  cargandoMas?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ResultadosConsulta({
  procesos,
  seleccionado,
  onSeleccionar,
  paginacion,
  onVerMas,
  cargandoMas,
}: Props) {
  if (procesos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2.5 py-10 text-[var(--ink-subtle)]">
        <Search className="w-7 h-7 opacity-35" />
        <p className="text-sm">Sin resultados para esta busqueda</p>
      </div>
    )
  }

  const hayMas =
    paginacion !== null &&
    paginacion !== undefined &&
    paginacion.pagina < paginacion.cantidadPaginas

  return (
    <div className="flex flex-col gap-1.5">
      {procesos.map((proceso) => {
        const demandante = findSujetoPorRol(proceso.partes, "demandante")
        const demandado = findSujetoPorRol(proceso.partes, "demandado")
        const isSelected = seleccionado === proceso.cpnuIdProceso

        return (
          <button
            key={proceso.cpnuIdProceso}
            type="button"
            onClick={() => onSeleccionar(proceso.cpnuIdProceso)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
              isSelected
                ? "bg-[var(--brand-soft)] border-[var(--brand)]"
                : "bg-[var(--surface)] border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--sunken)]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono text-[var(--ink-subtle)] tabular-nums">
                  {formatearRadicadoDisplay(proceso.radicado)}
                </p>
                <p className="text-sm font-medium text-[var(--ink)] truncate mt-0.5">
                  {demandante?.nombre ?? "---"}
                  <span className="text-[var(--ink-subtle)] font-normal text-xs mx-1">
                    vs.
                  </span>
                  {demandado?.nombre ?? "---"}
                </p>
                <p className="text-xs text-[var(--ink-muted)] truncate mt-0.5">
                  {proceso.despacho}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {proceso.esPrivado && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--warning-soft)] text-[var(--warning-ink)]">
                    <Lock className="w-2.5 h-2.5" />
                    Privado
                  </span>
                )}
                <p className="text-[10px] text-[var(--ink-subtle)] tabular-nums whitespace-nowrap">
                  {formatFecha(proceso.fechaUltimaActuacion)}
                </p>
              </div>
            </div>
          </button>
        )
      })}

      {hayMas && (
        <button
          type="button"
          onClick={onVerMas}
          disabled={cargandoMas}
          className="w-full mt-0.5 py-2 text-xs font-medium text-[var(--brand-ink)] hover:underline underline-offset-2 disabled:opacity-50 transition-opacity"
        >
          {cargandoMas
            ? "Cargando..."
            : `Ver mas resultados (${paginacion!.cantidadRegistros - procesos.length} restantes)`}
        </button>
      )}
    </div>
  )
}
