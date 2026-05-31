import { describe, expect, it, vi } from "vitest"
import {
  consultarNLImpl,
  consultarNombreImpl,
  consultarRadicadoImpl,
  interpretarNLImpl,
  mapActionError,
  monitorearImpl,
} from "@/app/(dashboard)/procesos/actions.impl"
import { CpnuError } from "@/lib/judicial/cpnu-error"
import type { Proceso } from "@/lib/judicial/model"
import { NlExtractorError } from "@/lib/judicial/nl-extractor.error"
import { createFixtureClient } from "@/lib/judicial/__tests__/helpers/test-client"
import {
  CPNU_TEST_ID_PROCESO,
  CPNU_TEST_NOMBRE,
  CPNU_TEST_RADICADO,
} from "@/lib/judicial/__tests__/helpers/fixtures"

const userId = "user-test"

function createDeps(overrides?: {
  cpnuClient?: ReturnType<typeof createFixtureClient>
  nlExtractor?: { extraer: ReturnType<typeof vi.fn> }
}) {
  return {
    cpnuClient: overrides?.cpnuClient ?? createFixtureClient(),
    repository: { monitorear: vi.fn() },
    nlExtractor: overrides?.nlExtractor ?? { extraer: vi.fn() },
  }
}

describe("procesos actions", () => {
  it("consultarRadicadoImpl retorna preview con fixture", async () => {
    const result = await consultarRadicadoImpl(
      userId,
      { radicado: CPNU_TEST_RADICADO },
      { cpnuClient: createFixtureClient(), repository: { monitorear: vi.fn() } }
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.procesos).toHaveLength(1)
    expect(result.procesos[0]?.radicado).toBe(CPNU_TEST_RADICADO)
    expect(result.procesos[0]?.cpnuIdProceso).toBe(CPNU_TEST_ID_PROCESO)
    expect(result.paginacion).toMatchObject({
      pagina: 1,
      cantidadPaginas: 1,
      cantidadRegistros: 1,
    })
  })

  it("consultarRadicadoImpl rechaza radicado invalido", async () => {
    const result = await consultarRadicadoImpl(
      userId,
      { radicado: "123" },
      { cpnuClient: createFixtureClient(), repository: { monitorear: vi.fn() } }
    )

    expect(result).toEqual({
      ok: false,
      code: "VALIDATION",
      error: expect.stringContaining("radicado"),
    })
  })

  it("consultarRadicadoImpl retorna lista vacia sin error", async () => {
    const cpnuClient = {
      porRadicado: vi.fn().mockResolvedValue({
        procesos: [],
        paginacion: {
          cantidadRegistros: 0,
          registrosPagina: 20,
          cantidadPaginas: 0,
          pagina: 1,
          paginas: null,
        },
      }),
      porNombre: vi.fn(),
    }

    const result = await consultarRadicadoImpl(
      userId,
      { radicado: CPNU_TEST_RADICADO },
      { cpnuClient: cpnuClient as never, repository: { monitorear: vi.fn() } }
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.procesos).toEqual([])
  })

  it("consultarNombreImpl retorna paginacion con fixture", async () => {
    const result = await consultarNombreImpl(
      userId,
      { nombre: CPNU_TEST_NOMBRE, tipoPersona: "nat" },
      { cpnuClient: createFixtureClient(), repository: { monitorear: vi.fn() } }
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.procesos.length).toBeGreaterThan(0)
    expect(result.paginacion).toMatchObject({
      pagina: 1,
      cantidadPaginas: 1,
    })
  })

  it("monitorearImpl delega al repository y retorna ids persistidos", async () => {
    const persisted: Proceso = {
      id: "proc-1",
      cpnuIdProceso: CPNU_TEST_ID_PROCESO,
      cpnuIdConexion: 450,
      radicado: CPNU_TEST_RADICADO,
      despacho: "JUZGADO",
      departamento: "ANTIOQUIA",
      esPrivado: false,
      partes: [],
      fechaRadicacion: "2020-12-21T00:00:00",
      fechaUltimaActuacion: "2026-05-22T00:00:00",
      estado: "activo",
      alertas: 0,
    }

    const monitorear = vi.fn().mockResolvedValue(persisted)

    const result = await monitorearImpl(
      userId,
      { cpnuIdProceso: CPNU_TEST_ID_PROCESO },
      { cpnuClient: createFixtureClient(), repository: { monitorear } }
    )

    expect(monitorear).toHaveBeenCalledWith(userId, CPNU_TEST_ID_PROCESO)
    expect(result).toEqual({
      ok: true,
      procesoId: "proc-1",
      radicado: CPNU_TEST_RADICADO,
    })
  })

  it("mapActionError traduce timeout de CPNU", () => {
    const mapped = mapActionError(
      new CpnuError("timeout", "TIMEOUT", { url: "https://example.test" })
    )

    expect(mapped.code).toBe("TIMEOUT")
    expect(mapped.error).toContain("tardo demasiado")
  })

  it("consultarRadicadoImpl propaga error degradado de CPNU", async () => {
    const cpnuClient = {
      porRadicado: vi.fn().mockRejectedValue(
        new CpnuError("timeout", "TIMEOUT", { url: "https://example.test" })
      ),
      porNombre: vi.fn(),
    }

    const result = await consultarRadicadoImpl(
      userId,
      { radicado: CPNU_TEST_RADICADO },
      { cpnuClient: cpnuClient as never, repository: { monitorear: vi.fn() } }
    )

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe("TIMEOUT")
    expect(result.error).toContain("tardo demasiado")
  })

  it("consultarNLImpl enruta por radicado en entidades", async () => {
    const result = await consultarNLImpl(
      userId,
      {
        entidades: { radicado: CPNU_TEST_RADICADO },
        confianza: { radicado: 1 },
      },
      createDeps()
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.procesos[0]?.radicado).toBe(CPNU_TEST_RADICADO)
    expect(result.entidades.radicado).toBe(CPNU_TEST_RADICADO)
  })

  it("consultarNLImpl enruta por nombre con codificacionDespacho", async () => {
    const porNombre = vi.fn().mockResolvedValue({
      procesos: [
        {
          idProceso: CPNU_TEST_ID_PROCESO,
          idConexion: 450,
          llaveProceso: CPNU_TEST_RADICADO,
          fechaProceso: "2020-12-21T00:00:00",
          fechaUltimaActuacion: "2026-05-22T00:00:00",
          despacho: "JUZGADO",
          departamento: "ANTIOQUIA",
          sujetosProcesales: "",
          esPrivado: false,
          cantFilas: -1,
        },
      ],
      paginacion: {
        cantidadRegistros: 1,
        registrosPagina: 20,
        cantidadPaginas: 1,
        pagina: 1,
        paginas: null,
      },
    })

    const result = await consultarNLImpl(
      userId,
      {
        entidades: {
          nombre: CPNU_TEST_NOMBRE,
          tipoPersona: "nat",
          depto: "Antioquia",
          ciudad: "Medellin",
          especialidad: "penal",
        },
        confianza: { nombre: 0.9 },
      },
      createDeps({
        cpnuClient: { porRadicado: vi.fn(), porNombre } as never,
      })
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(porNombre).toHaveBeenCalledWith(
      CPNU_TEST_NOMBRE,
      "nat",
      expect.objectContaining({ codificacionDespacho: "05001" })
    )
    expect(result.codigos.ciudad?.codigo).toBe("001")
  })

  it("consultarNLImpl usa codificacionDespacho de 12 digitos cuando hay despacho", async () => {
    const porNombre = vi.fn().mockResolvedValue({
      procesos: [
        {
          idProceso: CPNU_TEST_ID_PROCESO,
          idConexion: 450,
          llaveProceso: CPNU_TEST_RADICADO,
          fechaProceso: "2020-12-21T00:00:00",
          fechaUltimaActuacion: "2026-05-22T00:00:00",
          despacho: "JUZGADO",
          departamento: "ANTIOQUIA",
          sujetosProcesales: "",
          esPrivado: false,
          cantFilas: -1,
        },
      ],
      paginacion: {
        cantidadRegistros: 1,
        registrosPagina: 20,
        cantidadPaginas: 1,
        pagina: 1,
        paginas: null,
      },
    })

    const result = await consultarNLImpl(
      userId,
      {
        entidades: {
          nombre: CPNU_TEST_NOMBRE,
          despacho: "Juzgado 1 Penal de Conocimiento de Medellin",
        },
        confianza: { nombre: 0.9 },
      },
      createDeps({
        cpnuClient: { porRadicado: vi.fn(), porNombre } as never,
      })
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(porNombre).toHaveBeenCalledWith(
      CPNU_TEST_NOMBRE,
      "nat",
      expect.objectContaining({ codificacionDespacho: "050013109001" })
    )
  })

  it("consultarNLImpl acepta procesos CPNU con fechaProceso null", async () => {
    const porNombre = vi.fn().mockResolvedValue({
      procesos: [
        {
          idProceso: 176571201,
          idConexion: 450,
          llaveProceso: "11001400300320210012300",
          fechaProceso: null,
          fechaUltimaActuacion: "2024-06-10T00:00:00",
          despacho: "JUZGADO 003 CIVIL DEL CIRCUITO DE BOGOTA",
          departamento: "BOGOTA",
          sujetosProcesales: "Demandado: SEBASTIAN LOPEZ GOMEZ",
          esPrivado: false,
          cantFilas: -1,
        },
      ],
      paginacion: {
        cantidadRegistros: 1,
        registrosPagina: 20,
        cantidadPaginas: 1,
        pagina: 1,
        paginas: null,
      },
    })

    const result = await consultarNLImpl(
      userId,
      {
        entidades: {
          nombre: "Sebastian Lopez Gomez",
          tipoPersona: "nat",
        },
        confianza: { nombre: 0.9 },
        soloActivos: true,
      },
      createDeps({
        cpnuClient: { porRadicado: vi.fn(), porNombre } as never,
      })
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.procesos).toHaveLength(1)
    expect(result.procesos[0]?.fechaRadicacion).toBe("2024-06-10T00:00:00")
    expect(porNombre).toHaveBeenCalledWith(
      "Sebastian Lopez Gomez",
      "nat",
      expect.objectContaining({ soloActivos: true })
    )
  })

  it("consultarNLImpl retorna NL_AMBIGUOUS sin radicado ni nombre", async () => {
    const result = await consultarNLImpl(
      userId,
      {
        entidades: { depto: "Antioquia", anio: 2020 },
      },
      createDeps()
    )

    expect(result).toEqual({
      ok: false,
      code: "NL_AMBIGUOUS",
      error: expect.stringContaining("radicado o el nombre"),
    })
  })

  it("interpretarNLImpl extrae y normaliza entidades", async () => {
    const extraer = vi.fn().mockResolvedValue({
      entidades: {
        nombre: CPNU_TEST_NOMBRE,
        depto: "Antioquia",
        ciudad: "Medellin",
        especialidad: "penal",
      },
      confianza: { nombre: 0.9 },
      textoOriginal: "consulta",
    })

    const result = await interpretarNLImpl(
      userId,
      { texto: "procesos penales en Medellin" },
      createDeps({ nlExtractor: { extraer } })
    )

    expect(extraer).toHaveBeenCalledOnce()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.codigos.depto?.codigo).toBe("05")
    expect(result.codigos.ciudad?.codigo).toBe("001")
    expect(result.codigos.especialidad?.codigo).toBe("60")
  })

  it("interpretarNLImpl mapea error del extractor", async () => {
    const extraer = vi
      .fn()
      .mockRejectedValue(new NlExtractorError("sin herramienta", "NO_TOOL_USE"))

    const result = await interpretarNLImpl(
      userId,
      { texto: "consulta ambigua" },
      createDeps({ nlExtractor: { extraer } })
    )

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe("NO_TOOL_USE")
    expect(result.error).toContain("especifico")
  })

  it("mapActionError traduce error del extractor", () => {
    const mapped = mapActionError(
      new NlExtractorError("api down", "API_ERROR")
    )

    expect(mapped.code).toBe("API_ERROR")
    expect(mapped.error).toContain("interpretacion")
  })
})
