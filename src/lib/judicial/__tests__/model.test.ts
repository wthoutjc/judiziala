import { describe, expect, it } from "vitest"
import {
  CPNU_TEST_ID_PROCESO,
  CPNU_TEST_RADICADO,
} from "./helpers/fixtures"
import {
  JudicialModelError,
  deriveJurisdiccion,
  findSujetoPorRol,
  labelRolSujeto,
  listSujetosDisplay,
  parseActuacion,
  parseAlerta,
  parseMonitoreoProceso,
  parseProceso,
  parseProcesoEnCartera,
  parseSujeto,
} from "../model"

const procesoFixture = {
  id: "cltest123",
  cpnuIdProceso: CPNU_TEST_ID_PROCESO,
  cpnuIdConexion: 450,
  radicado: CPNU_TEST_RADICADO,
  despacho: "JUZGADO 001 PENAL DEL CIRCUITO",
  departamento: "ANTIOQUIA",
  ponente: "Juez Ponente",
  tipoProceso: "Delitos Contra la Vida",
  claseProceso: "Homicidio",
  subclaseProceso: "Homicidio Culposo",
  recurso: "Sin Tipo de Recurso",
  ubicacion: "Despacho Conocimiento",
  esPrivado: false,
  partes: [
    {
      rol: "demandante" as const,
      nombre: "FISCALIA GENERAL DE LA NACION",
      raw: "Demandante: FISCALIA GENERAL DE LA NACION",
    },
    {
      rol: "demandado" as const,
      nombre: "EDIBER CEFERINO RINCON",
      raw: "Demandado: EDIBER CEFERINO RINCON",
    },
  ],
  fechaRadicacion: "2020-12-21T00:00:00",
  fechaUltimaActuacion: "2026-05-22T00:00:00",
  ultimaActualizacion: "2026-05-30T00:00:00",
  estado: "activo" as const,
  alertas: 0,
}

describe("model.ts", () => {
  it("parsea Proceso valido", () => {
    const proceso = parseProceso(procesoFixture)

    expect(proceso.radicado).toBe(CPNU_TEST_RADICADO)
    expect(proceso.partes).toHaveLength(2)
  })

  it("rechaza radicado invalido", () => {
    expect(() =>
      parseProceso({ ...procesoFixture, radicado: "123" })
    ).toThrow(JudicialModelError)
  })

  it("parsea Sujeto y Actuacion", () => {
    const sujeto = parseSujeto(procesoFixture.partes[0])
    const actuacion = parseActuacion({
      id: "1586079245",
      procesoId: procesoFixture.id,
      consActuacion: 13,
      fecha: "2026-05-22T00:00:00",
      tipo: "Fija Fecha Audiencia",
      descripcion: "Constancia secretarial.",
      fechaRegistro: "2026-05-26T00:00:00",
      conDocumentos: false,
      estado: "actual",
    })

    expect(sujeto.rol).toBe("demandante")
    expect(actuacion.conDocumentos).toBe(false)
  })

  it("parsea tipos de cartera", () => {
    const monitoreo = parseMonitoreoProceso({
      id: "mon1",
      userId: "user1",
      procesoId: procesoFixture.id,
      createdAt: "2026-05-30T10:00:00",
    })

    const alerta = parseAlerta({
      id: "al1",
      userId: "user1",
      procesoId: procesoFixture.id,
      radicado: CPNU_TEST_RADICADO,
      tipo: "urgente",
      titulo: "Audiencia proxima",
      descripcion: "Fija fecha audiencia",
      leida: false,
      createdAt: "2026-05-30T10:00:00",
    })

    const enCartera = parseProcesoEnCartera({
      ...procesoFixture,
      monitoreoId: monitoreo.id,
      monitoreadoDesde: monitoreo.createdAt,
    })

    expect(monitoreo.procesoId).toBe(procesoFixture.id)
    expect(alerta.tipo).toBe("urgente")
    expect(enCartera.monitoreoId).toBe("mon1")
  })

  it("deriva jurisdiccion y busca sujetos por rol", () => {
    const proceso = parseProceso(procesoFixture)

    expect(deriveJurisdiccion(proceso)).toContain("Homicidio")
    expect(findSujetoPorRol(proceso.partes, "demandado")?.nombre).toContain("EDIBER")
  })

  it("lista sujetos con etiquetas legibles preservando orden", () => {
    const proceso = parseProceso(procesoFixture)
    const sujetos = listSujetosDisplay(proceso.partes)

    expect(sujetos.length).toBe(proceso.partes.length)
    expect(sujetos[0]?.rolLabel).toBe(labelRolSujeto(sujetos[0]!.rol))
    expect(sujetos.some((sujeto) => sujeto.rol === "demandante")).toBe(true)
    expect(labelRolSujeto("fiscalia")).toBe("Fiscalia")
  })
})
