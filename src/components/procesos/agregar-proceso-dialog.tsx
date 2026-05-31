"use client"

import { useState } from "react"
import { Loader2, Sparkles, Search, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Proceso } from "@/lib/judicial/model"
import {
  consultarRadicado,
  consultarNombre,
  consultarNL,
  interpretarNL,
  monitorear,
} from "@/app/(dashboard)/procesos/actions"
import type {
  CodigosResueltos,
  PaginacionConsulta,
} from "@/app/(dashboard)/procesos/actions.types"
import type { NlEntidades, ConfianzaMap } from "@/lib/judicial/nl-schema"
import { formatearRadicado, ResultadosConsulta } from "./resultados-consulta"

function isValidRadicado(s: string): boolean {
  return /^\d{23}$/.test(s)
}

type SearchState = {
  status: "idle" | "buscando" | "done" | "error"
  procesos: Proceso[]
  paginacion: PaginacionConsulta | null
  error: string | null
}

const IDLE: SearchState = {
  status: "idle",
  procesos: [],
  paginacion: null,
  error: null,
}

export type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgregado?: (procesoId: string, radicado: string) => void
}

const CHIP_LABELS: Record<keyof NlEntidades, string> = {
  radicado: "Radicado",
  nombre: "Nombre",
  tipoPersona: "Tipo",
  depto: "Departamento",
  ciudad: "Ciudad",
  especialidad: "Especialidad",
  anio: "Anio",
  despacho: "Despacho",
}

const NL_KEYS = Object.keys(CHIP_LABELS) as (keyof NlEntidades)[]

function formatTipoPersona(value: unknown): string {
  return value === "nat" ? "Persona natural" : "Empresa"
}

function chipDisplayValue(
  key: keyof NlEntidades,
  value: unknown,
  codigos: CodigosResueltos
): string {
  if (key === "tipoPersona") return formatTipoPersona(value)
  if (key === "anio") return String(value)

  const codigo = codigos[key as keyof CodigosResueltos]
  if (codigo && typeof value === "string") {
    return `${value} (${codigo.codigo})`
  }
  return String(value)
}

function InterpretacionChips({
  entidades,
  confianza,
  codigos,
  onChange,
  onRemove,
}: {
  entidades: NlEntidades
  confianza: ConfianzaMap
  codigos: CodigosResueltos
  onChange: (key: keyof NlEntidades, value: string) => void
  onRemove: (key: keyof NlEntidades) => void
}) {
  const activeKeys = NL_KEYS.filter(
    (key) => entidades[key] !== undefined && entidades[key] !== null
  )

  if (activeKeys.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] font-medium text-[var(--ink-subtle)]">
        Busqueda interpretada como (editable):
      </p>
      <div className="flex flex-col gap-2">
        {activeKeys.map((key) => {
          const conf = confianza[key] ?? 1
          const isLowConf = conf < 0.6
          const raw = entidades[key]
          const inputValue =
            key === "tipoPersona"
              ? String(raw)
              : key === "anio"
                ? String(raw)
                : String(raw ?? "")

          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2 py-1.5",
                isLowConf
                  ? "border-[var(--warning-ink)]/30 bg-[var(--warning-soft)]"
                  : "border-[var(--line)] bg-[var(--surface)]"
              )}
            >
              <span className="text-[10px] font-medium text-[var(--ink-subtle)] w-24 shrink-0">
                {CHIP_LABELS[key]}
              </span>
              {key === "tipoPersona" ? (
                <select
                  value={inputValue}
                  onChange={(e) =>
                    onChange(key, e.target.value as "nat" | "jur")
                  }
                  className="flex-1 h-7 text-xs rounded border border-[var(--line)] bg-[var(--surface)] px-2"
                >
                  <option value="nat">Persona natural</option>
                  <option value="jur">Empresa</option>
                </select>
              ) : (
                <input
                  type={key === "anio" ? "number" : "text"}
                  value={inputValue}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="flex-1 h-7 text-xs rounded border border-[var(--line)] bg-[var(--surface)] px-2 min-w-0"
                />
              )}
              <span className="text-[10px] text-[var(--ink-subtle)] hidden sm:inline truncate max-w-[120px]">
                {chipDisplayValue(key, raw, codigos)}
              </span>
              <button
                type="button"
                aria-label={`Quitar ${CHIP_LABELS[key]}`}
                onClick={() => onRemove(key)}
                className="shrink-0 opacity-50 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AgregarProcesoDialog({ open, onOpenChange, onAgregado }: Props) {
  const [activeTab, setActiveTab] = useState("radicado")

  const [radicado, setRadicado] = useState("")
  const [radicadoError, setRadicadoError] = useState<string | null>(null)
  const [radicadoState, setRadicadoState] = useState<SearchState>(IDLE)

  const [nombre, setNombre] = useState("")
  const [tipoPersona, setTipoPersona] = useState<"nat" | "jur">("nat")
  const [soloActivos, setSoloActivos] = useState(false)
  const [nombreError, setNombreError] = useState<string | null>(null)
  const [nombreState, setNombreState] = useState<SearchState>(IDLE)
  const [cargandoMas, setCargandoMas] = useState(false)

  const [texto, setTexto] = useState("")
  const [textoError, setTextoError] = useState<string | null>(null)
  const [nlSoloActivos, setNlSoloActivos] = useState(false)
  const [nlInterpretando, setNlInterpretando] = useState(false)
  const [nlInterpretado, setNlInterpretado] = useState(false)
  const [nlEntidades, setNlEntidades] = useState<NlEntidades>({})
  const [nlConfianza, setNlConfianza] = useState<ConfianzaMap>({})
  const [nlCodigos, setNlCodigos] = useState<CodigosResueltos>({})
  const [nlInterpretError, setNlInterpretError] = useState<string | null>(null)
  const [nlState, setNlState] = useState<SearchState>(IDLE)

  const [seleccionado, setSeleccionado] = useState<number | null>(null)
  const [agregando, setAgregando] = useState(false)
  const [agregarError, setAgregarError] = useState<string | null>(null)

  const currentState =
    activeTab === "radicado"
      ? radicadoState
      : activeTab === "nombre"
        ? nombreState
        : nlState
  const showResults =
    currentState.status === "done" ||
    (currentState.status === "error" && currentState.procesos.length > 0)

  function resetAll() {
    setActiveTab("radicado")
    setRadicado("")
    setRadicadoError(null)
    setRadicadoState(IDLE)
    setNombre("")
    setTipoPersona("nat")
    setSoloActivos(false)
    setNombreError(null)
    setNombreState(IDLE)
    setCargandoMas(false)
    setTexto("")
    setTextoError(null)
    setNlSoloActivos(false)
    setNlInterpretando(false)
    setNlInterpretado(false)
    setNlEntidades({})
    setNlConfianza({})
    setNlCodigos({})
    setNlInterpretError(null)
    setNlState(IDLE)
    setSeleccionado(null)
    setAgregando(false)
    setAgregarError(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetAll()
    onOpenChange(next)
  }

  function handleTabChange(tab: string) {
    setActiveTab(tab)
    setSeleccionado(null)
    setAgregarError(null)
  }

  async function handleBuscarRadicado(e: React.FormEvent) {
    e.preventDefault()
    setRadicadoError(null)
    setAgregarError(null)

    if (!isValidRadicado(radicado)) {
      setRadicadoError("El radicado debe tener exactamente 23 digitos numericos.")
      return
    }

    setSeleccionado(null)
    setRadicadoState({ status: "buscando", procesos: [], paginacion: null, error: null })

    const result = await consultarRadicado({ radicado })

    if (!result.ok) {
      setRadicadoState({ status: "error", procesos: [], paginacion: null, error: result.error })
      return
    }

    setRadicadoState({
      status: "done",
      procesos: result.procesos,
      paginacion: result.paginacion,
      error: null,
    })
  }

  async function buscarNombre(pagina: number) {
    if (nombre.trim().length < 3) {
      setNombreError("Ingresa al menos 3 caracteres.")
      return
    }

    setNombreError(null)
    setAgregarError(null)

    if (pagina === 1) {
      setSeleccionado(null)
      setNombreState({ status: "buscando", procesos: [], paginacion: null, error: null })
    } else {
      setCargandoMas(true)
    }

    const result = await consultarNombre({
      nombre: nombre.trim(),
      tipoPersona,
      soloActivos,
      pagina,
    })

    if (pagina > 1) setCargandoMas(false)

    if (!result.ok) {
      if (pagina === 1) {
        setNombreState({ status: "error", procesos: [], paginacion: null, error: result.error })
      }
      return
    }

    setNombreState((prev) => ({
      status: "done",
      procesos: pagina === 1 ? result.procesos : [...prev.procesos, ...result.procesos],
      paginacion: result.paginacion,
      error: null,
    }))
  }

  function handleBuscarNombreForm(e: React.FormEvent) {
    e.preventDefault()
    buscarNombre(1)
  }

  function handleVerMas() {
    if (!nombreState.paginacion) return
    buscarNombre(nombreState.paginacion.pagina + 1)
  }

  async function handleInterpretarNL(e: React.FormEvent) {
    e.preventDefault()
    setTextoError(null)
    setNlInterpretError(null)
    setAgregarError(null)
    setNlState(IDLE)

    if (texto.trim().length < 5) {
      setTextoError("Describe la busqueda con al menos 5 caracteres.")
      return
    }

    setNlInterpretando(true)
    const result = await interpretarNL({ texto: texto.trim() })
    setNlInterpretando(false)

    if (!result.ok) {
      setNlInterpretado(false)
      setNlInterpretError(result.error)
      return
    }

    setNlEntidades(result.entidades)
    setNlConfianza(result.confianza)
    setNlCodigos(result.codigos)
    setNlInterpretado(true)
    setSeleccionado(null)
  }

  function handleNlEntidadChange(key: keyof NlEntidades, value: string) {
    setNlEntidades((prev) => {
      const next = { ...prev }
      if (key === "tipoPersona") {
        next.tipoPersona = value as "nat" | "jur"
      } else if (key === "anio") {
        const n = parseInt(value, 10)
        if (Number.isNaN(n)) delete next.anio
        else next.anio = n
      } else if (key === "radicado") {
        const digits = value.replace(/\D/g, "").slice(0, 23)
        if (digits) next.radicado = digits
        else delete next.radicado
      } else if (value.trim()) {
        next[key] = value.trim()
      } else {
        delete next[key]
      }
      return next
    })
    setNlCodigos({})
  }

  function handleNlEntidadRemove(key: keyof NlEntidades) {
    setNlEntidades((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setNlCodigos((prev) => {
      const next = { ...prev }
      delete next[key as keyof CodigosResueltos]
      return next
    })
  }

  async function handleBuscarCpnuNL() {
    setAgregarError(null)
    setSeleccionado(null)
    setNlState({ status: "buscando", procesos: [], paginacion: null, error: null })

    const result = await consultarNL({
      entidades: nlEntidades,
      confianza: nlConfianza,
      soloActivos: nlSoloActivos,
    })

    if (!result.ok) {
      setNlState({ status: "error", procesos: [], paginacion: null, error: result.error })
      return
    }

    setNlCodigos(result.codigos)
    setNlState({
      status: "done",
      procesos: result.procesos,
      paginacion: result.paginacion,
      error: null,
    })
  }

  async function handleAgregar() {
    if (seleccionado === null) return
    setAgregando(true)
    setAgregarError(null)

    const result = await monitorear({ cpnuIdProceso: seleccionado })
    setAgregando(false)

    if (!result.ok) {
      setAgregarError(result.error)
      return
    }

    onAgregado?.(result.procesoId, result.radicado)
    handleOpenChange(false)
  }

  const nlTieneEntidadConsultable = Boolean(
    nlEntidades.radicado || nlEntidades.nombre
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90dvh]"
        showCloseButton={false}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 flex-shrink-0">
          <div>
            <DialogTitle className="text-base font-semibold text-[var(--ink)]">
              Agregar proceso
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--ink-subtle)] mt-0.5">
              Busca por radicado, nombre o lenguaje natural.
            </DialogDescription>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => handleOpenChange(false)}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="px-4 flex-shrink-0">
            <TabsList className="w-full">
              <TabsTrigger value="radicado" className="flex-1 text-xs">
                Radicado
              </TabsTrigger>
              <TabsTrigger value="nombre" className="flex-1 text-xs">
                Nombre / Razon social
              </TabsTrigger>
              <TabsTrigger value="nl" className="flex-1 text-xs gap-1">
                Lenguaje natural
                <Sparkles className="w-3 h-3 opacity-60" />
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="radicado" className="px-4 pt-3 pb-1">
              <form onSubmit={handleBuscarRadicado} className="flex flex-col gap-2">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={23}
                      value={radicado}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 23)
                        setRadicado(v)
                        setRadicadoError(null)
                      }}
                      placeholder="23 digitos del radicado"
                      autoComplete="off"
                      className={cn(
                        "w-full h-9 px-3 pr-14 rounded-md border bg-[var(--surface)] text-sm font-mono tracking-wide text-[var(--ink)] placeholder:text-[var(--ink-subtle)] placeholder:font-sans placeholder:tracking-normal outline-none transition-colors",
                        radicadoError
                          ? "border-[var(--danger)] focus:ring-1 focus:ring-[var(--danger)]"
                          : "border-[var(--line)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--ink-subtle)] tabular-nums pointer-events-none">
                      {radicado.length}/23
                    </span>
                  </div>
                  {radicado.length > 0 && (
                    <p className="text-[10px] font-mono text-[var(--ink-subtle)] mt-1.5 px-0.5">
                      {radicado.length === 23 ? (
                        formatearRadicado(radicado)
                      ) : (
                        <span className="opacity-60">
                          Ingresa los 23 digitos para ver la vista previa
                        </span>
                      )}
                    </p>
                  )}
                  {radicadoError && (
                    <p className="text-xs text-[var(--danger)] mt-1">{radicadoError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={radicadoState.status === "buscando"}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-[var(--brand)] text-[oklch(0.99_0.004_250)] text-xs font-medium rounded-md hover:bg-[var(--brand-hover)] disabled:opacity-60 transition-colors w-fit"
                >
                  {radicadoState.status === "buscando" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  {radicadoState.status === "buscando" ? "Buscando..." : "Buscar"}
                </button>
                {radicadoState.status === "error" && radicadoState.procesos.length === 0 && (
                  <p className="text-xs text-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2 rounded-md">
                    {radicadoState.error}
                  </p>
                )}
              </form>
            </TabsContent>

            <TabsContent value="nombre" className="px-4 pt-3 pb-1">
              <form onSubmit={handleBuscarNombreForm} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value)
                    setNombreError(null)
                  }}
                  placeholder="Nombre del demandante o demandado"
                  autoComplete="off"
                  className={cn(
                    "w-full h-9 px-3 rounded-md border bg-[var(--surface)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-subtle)] outline-none transition-colors",
                    nombreError
                      ? "border-[var(--danger)] focus:ring-1 focus:ring-[var(--danger)]"
                      : "border-[var(--line)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                  )}
                />
                {nombreError && (
                  <p className="text-xs text-[var(--danger)] mt-1">{nombreError}</p>
                )}
                <div className="flex gap-1.5">
                  {(["nat", "jur"] as const).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoPersona(tipo)}
                      className={cn(
                        "flex-1 h-8 rounded-md text-xs font-medium border transition-colors",
                        tipoPersona === tipo
                          ? "bg-[var(--brand-soft)] border-[var(--brand)] text-[var(--brand-ink)]"
                          : "bg-[var(--surface)] border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--line-strong)]"
                      )}
                    >
                      {tipo === "nat" ? "Persona natural" : "Empresa"}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={soloActivos}
                    onChange={(e) => setSoloActivos(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border border-[var(--line)] accent-[var(--brand)]"
                  />
                  <span className="text-xs text-[var(--ink-muted)]">Solo procesos activos</span>
                </label>
                <button
                  type="submit"
                  disabled={nombreState.status === "buscando"}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-[var(--brand)] text-[oklch(0.99_0.004_250)] text-xs font-medium rounded-md hover:bg-[var(--brand-hover)] disabled:opacity-60 transition-colors w-fit"
                >
                  {nombreState.status === "buscando" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  {nombreState.status === "buscando" ? "Buscando..." : "Buscar"}
                </button>
                {nombreState.status === "error" && nombreState.procesos.length === 0 && (
                  <p className="text-xs text-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2 rounded-md">
                    {nombreState.error}
                  </p>
                )}
              </form>
            </TabsContent>

            <TabsContent value="nl" className="px-4 pt-3 pb-1">
              <form onSubmit={handleInterpretarNL} className="flex flex-col gap-3">
                <textarea
                  rows={3}
                  value={texto}
                  onChange={(e) => {
                    setTexto(e.target.value)
                    setTextoError(null)
                    setNlInterpretError(null)
                  }}
                  placeholder='Por ejemplo: "Procesos de Garcia contra Zurich en Medellin desde 2022"'
                  maxLength={500}
                  className={cn(
                    "w-full px-3 py-2 rounded-md border bg-[var(--surface)] text-sm text-[var(--ink)]",
                    "placeholder:text-[var(--ink-subtle)] resize-none outline-none transition-colors",
                    textoError
                      ? "border-[var(--danger)] focus:ring-1 focus:ring-[var(--danger)]"
                      : "border-[var(--line)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                  )}
                />
                {textoError && (
                  <p className="text-xs text-[var(--danger)]">{textoError}</p>
                )}

                <button
                  type="submit"
                  disabled={nlInterpretando}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-[var(--brand)] text-[oklch(0.99_0.004_250)] text-xs font-medium rounded-md hover:bg-[var(--brand-hover)] disabled:opacity-60 transition-colors w-fit"
                >
                  {nlInterpretando ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Interpretando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Interpretar
                    </>
                  )}
                </button>

                {nlInterpretError && (
                  <p className="text-xs text-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2 rounded-md">
                    {nlInterpretError}
                  </p>
                )}
              </form>

              {nlInterpretado && (
                <>
                  <InterpretacionChips
                    entidades={nlEntidades}
                    confianza={nlConfianza}
                    codigos={nlCodigos}
                    onChange={handleNlEntidadChange}
                    onRemove={handleNlEntidadRemove}
                  />

                  <label className="flex items-center gap-2 cursor-pointer select-none w-fit mt-3">
                    <input
                      type="checkbox"
                      checked={nlSoloActivos}
                      onChange={(e) => setNlSoloActivos(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border border-[var(--line)] accent-[var(--brand)]"
                    />
                    <span className="text-xs text-[var(--ink-muted)]">Solo procesos activos</span>
                  </label>

                  <button
                    type="button"
                    disabled={!nlTieneEntidadConsultable || nlState.status === "buscando"}
                    onClick={handleBuscarCpnuNL}
                    className="mt-3 inline-flex items-center gap-2 h-9 px-4 border border-[var(--brand)] text-[var(--brand-ink)] bg-[var(--brand-soft)] text-xs font-medium rounded-md hover:bg-[var(--brand-soft)] disabled:opacity-50 transition-colors"
                  >
                    {nlState.status === "buscando" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Buscando en CPNU...
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        Buscar en CPNU
                      </>
                    )}
                  </button>

                  {!nlTieneEntidadConsultable && (
                    <p className="text-[11px] text-[var(--ink-subtle)] mt-2">
                      Incluye al menos un radicado o un nombre para consultar CPNU.
                    </p>
                  )}
                </>
              )}

              {nlState.status === "error" && nlState.procesos.length === 0 && (
                <p className="text-xs text-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2 rounded-md mt-3">
                  {nlState.error}
                </p>
              )}
            </TabsContent>

            {showResults && (
              <div className="px-4 pt-3 pb-4 border-t border-[var(--line)] mt-3">
                <ResultadosConsulta
                  procesos={currentState.procesos}
                  seleccionado={seleccionado}
                  onSeleccionar={(id) => {
                    setSeleccionado(id)
                    setAgregarError(null)
                  }}
                  paginacion={currentState.paginacion}
                  onVerMas={activeTab === "nombre" ? handleVerMas : undefined}
                  cargandoMas={cargandoMas}
                />
              </div>
            )}
          </div>
        </Tabs>

        {seleccionado !== null && (
          <div className="flex-shrink-0 border-t border-[var(--line)] bg-[var(--sunken)] px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-b-xl">
            {agregarError ? (
              <p className="text-xs text-[var(--danger)] flex-1">{agregarError}</p>
            ) : (
              <p className="text-xs text-[var(--ink-subtle)] flex-1">
                Proceso seleccionado. Confirma para agregarlo a tu cartera.
              </p>
            )}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="h-8 px-3 text-xs rounded-md border border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAgregar}
                disabled={agregando}
                className="inline-flex items-center gap-1.5 h-8 px-4 bg-[var(--brand)] text-[oklch(0.99_0.004_250)] text-xs font-medium rounded-md hover:bg-[var(--brand-hover)] disabled:opacity-60 transition-colors"
              >
                {agregando && <Loader2 className="w-3 h-3 animate-spin" />}
                {agregando ? "Agregando..." : "Agregar proceso"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
