"use client"

import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockDocumento } from "@/lib/mock-data"
import { useState, useEffect } from "react"
import {
  Sparkles,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Download,
  Share2,
  FileText,
  ShieldAlert,
} from "lucide-react"
import Link from "next/link"

export default function DocumentoPage() {
  const [iaLoaded, setIaLoaded] = useState(false)
  const doc = mockDocumento

  useEffect(() => {
    const t = setTimeout(() => setIaLoaded(true), 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Header title="Documento" />
      <main className="flex-1 flex flex-col p-6 max-w-[1280px] w-full">
        <Link
          href="/procesos/1"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] mb-4 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Volver al proceso
        </Link>

        {/* Document header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-2 font-medium border bg-[var(--info-soft)] text-[var(--info-ink)] border-[var(--info-soft)]"
              >
                {doc.tipo}
              </Badge>
              <span className="text-xs text-[var(--ink-subtle)] tabular">{doc.fecha}</span>
            </div>
            <h2 className="text-base font-semibold text-[var(--ink)]">
              {doc.resumenIA.tipodocumento}
            </h2>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">Juez: {doc.juez}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 h-8 text-xs text-[var(--ink-muted)] border border-[var(--line)] rounded-md hover:border-[var(--line-strong)] hover:text-[var(--ink)] transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button className="flex items-center gap-1.5 px-3 h-8 text-xs text-[var(--ink-muted)] border border-[var(--line)] rounded-md hover:border-[var(--line-strong)] hover:text-[var(--ink)] transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Compartir
            </button>
          </div>
        </div>

        {/* Split panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-[600px]">
          {/* PDF viewer */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--line)] bg-[var(--sunken)]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[var(--ink-subtle)]" />
                <span className="text-xs font-medium text-[var(--ink-muted)] font-mono">
                  auto-pruebas-{doc.id}.pdf
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  aria-label="Página anterior"
                  className="w-6 h-6 flex items-center justify-center hover:bg-[var(--line)] rounded transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                </button>
                <span className="text-xs text-[var(--ink-muted)] tabular px-1">1 / 4</span>
                <button
                  aria-label="Página siguiente"
                  className="w-6 h-6 flex items-center justify-center hover:bg-[var(--line)] rounded transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                </button>
              </div>
            </div>

            {/* Mock PDF content */}
            <div className="flex-1 bg-[var(--canvas)] p-6 overflow-y-auto">
              <div
                className="bg-[var(--surface)] rounded-lg p-8 max-w-lg mx-auto space-y-4 text-sm"
                style={{ boxShadow: "0 1px 2px oklch(0 0 0 / 0.04), 0 6px 24px oklch(0 0 0 / 0.04)" }}
              >
                <div className="text-center space-y-1 pb-4 border-b border-[var(--line)]">
                  <p className="font-semibold text-[10px] uppercase tracking-widest text-[var(--ink-subtle)]">
                    República de Colombia
                  </p>
                  <p className="font-semibold text-xs text-[var(--ink)]">
                    Juzgado 12 Civil del Circuito de Bogotá
                  </p>
                  <p className="text-[10px] text-[var(--ink-muted)]">
                    Bogotá D.C., quince (15) de marzo de dos mil veinticuatro (2024)
                  </p>
                </div>
                <p className="text-[11px] text-[var(--ink)] font-semibold">
                  AUTO INTERLOCUTORIO No. 045
                </p>
                <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed tabular">
                  Radicado: 11001310300120230012300
                </p>
                <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                  <span className="font-medium text-[var(--ink)]">DEMANDANTE:</span> Banco de Bogotá S.A.
                </p>
                <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                  <span className="font-medium text-[var(--ink)]">DEMANDADO:</span> Constructora Arco Ltda.
                </p>
                <div className="pt-3 border-t border-[var(--line)]">
                  <p className="text-[11px] font-semibold text-[var(--ink)] mb-2">CONSIDERACIONES</p>
                  <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                    Habiéndose surtido la audiencia inicial del veinte (20) de enero del presente año, y encontrándose el proceso en etapa probatoria, el Despacho procede a resolver sobre las pruebas solicitadas por las partes en la oportunidad procesal correspondiente...
                  </p>
                </div>
                <div className="pt-3 border-t border-[var(--line)]">
                  <p className="text-[11px] font-semibold text-[var(--ink)] mb-2">RESUELVE</p>
                  <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                    PRIMERO: DECRETANSE las pruebas documentales aportadas por ambas partes...
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed mt-2">
                    SEGUNDO: ADMÍTENSE los testimonios de los señores Juan Carlos Méndez, María Alejandra Ruiz y Pedro Hernández solicitados por la parte demandante...
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed mt-2">
                    TERCERO: INADMÍTESE el dictamen pericial de parte aportado por el demandante por haber sido presentado por fuera del término legal establecido...
                  </p>
                </div>
                <p className="text-[10px] text-[var(--ink-subtle)] pt-3 border-t border-[var(--line)]">
                  Dr. Carlos Andrés Rodríguez Gómez. Juez 12 Civil del Circuito de Bogotá.
                </p>
              </div>
            </div>
          </div>

          {/* AI Panel */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--line)] bg-[var(--brand-soft)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-ink)]" />
              <span className="text-xs font-semibold text-[var(--brand-ink)]">Análisis con IA</span>
              {iaLoaded && (
                <Badge className="ml-auto text-[9px] h-4 px-1.5 bg-[var(--success-soft)] text-[var(--success-ink)] hover:bg-[var(--success-soft)] border-transparent">
                  Listo
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {!iaLoaded ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24 bg-[var(--sunken)]" />
                    <Skeleton className="h-4 w-full bg-[var(--sunken)]" />
                    <Skeleton className="h-4 w-5/6 bg-[var(--sunken)]" />
                    <Skeleton className="h-4 w-4/5 bg-[var(--sunken)]" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-32 bg-[var(--sunken)]" />
                    <Skeleton className="h-4 w-full bg-[var(--sunken)]" />
                    <Skeleton className="h-4 w-3/4 bg-[var(--sunken)]" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--ink-subtle)]">
                    <div className="w-3 h-3 border-2 border-[var(--line-strong)] border-t-[var(--brand)] rounded-full animate-spin" />
                    Analizando documento...
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="resumen" className="h-full">
                  <TabsList className="w-full bg-[var(--sunken)] border border-[var(--line)] h-8 mb-4">
                    <TabsTrigger value="resumen" className="flex-1 text-xs h-6">
                      Resumen
                    </TabsTrigger>
                    <TabsTrigger value="fechas" className="flex-1 text-xs h-6">
                      Fechas
                    </TabsTrigger>
                    <TabsTrigger value="riesgos" className="flex-1 text-xs h-6">
                      Riesgos
                    </TabsTrigger>
                    <TabsTrigger value="pasos" className="flex-1 text-xs h-6">
                      Pasos
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="resumen" className="mt-0">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-[var(--ink-subtle)] uppercase tracking-wide mb-1.5">
                          Decisión del juez
                        </p>
                        <p className="text-sm text-[var(--ink)] leading-relaxed">
                          {doc.resumenIA.decision}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="fechas" className="mt-0">
                    <div className="space-y-2">
                      {doc.resumenIA.fechasImportantes.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-[var(--sunken)] rounded-lg"
                        >
                          <Calendar className="w-4 h-4 text-[var(--brand)] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-[var(--ink)] tabular">
                              {f.fecha}
                            </p>
                            <p className="text-xs text-[var(--ink-muted)] mt-0.5 leading-relaxed">
                              {f.descripcion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="riesgos" className="mt-0">
                    <div className="space-y-2">
                      {doc.resumenIA.riesgos.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-[var(--danger-soft)] rounded-lg"
                        >
                          <ShieldAlert className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-[var(--danger-ink)] leading-relaxed">{r}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="pasos" className="mt-0">
                    <ol className="space-y-2">
                      {doc.resumenIA.proximosPasos.map((paso, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 p-3 bg-[var(--sunken)] rounded-lg"
                        >
                          <span className="w-5 h-5 bg-[var(--brand)] rounded-full flex items-center justify-center flex-shrink-0 text-[oklch(0.99_0.004_250)] text-[10px] font-semibold tabular">
                            {i + 1}
                          </span>
                          <p className="text-xs text-[var(--ink)] leading-relaxed">{paso}</p>
                        </li>
                      ))}
                    </ol>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
