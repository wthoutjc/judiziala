import { expect } from "vitest"
import { cpnuProcesoCompleto, parseSujetosProcesales, trimCpnuText } from "../../adapter"
import type { CpnuProceso } from "../../cpnu.schemas"
import {
  parseActuacionesResponse,
  parseConsultaResponse,
  parseDetalleResponse,
} from "../../cpnu.schemas"
import type { Actuacion, Proceso } from "../../model"
import { loadFixture } from "./fixtures"

export type AdapterFixtureCase = {
  slug: string
  consultaFile: string
  detalleFile: string
  actuacionesFile: string
}

export const ADAPTER_FIXTURE_CASES: AdapterFixtureCase[] = [
  {
    slug: "penal-medellin",
    consultaFile: "consulta-radicado.json",
    detalleFile: "detalle-proceso.json",
    actuacionesFile: "actuaciones-proceso.json",
  },
  {
    slug: "extra-1",
    consultaFile: "consulta-extra-1.json",
    detalleFile: "detalle-extra-1.json",
    actuacionesFile: "actuaciones-extra-1.json",
  },
  {
    slug: "extra-2",
    consultaFile: "consulta-extra-2.json",
    detalleFile: "detalle-extra-2.json",
    actuacionesFile: "actuaciones-extra-2.json",
  },
]

export function loadAdapterFixtureCase(testCase: AdapterFixtureCase) {
  const consulta = parseConsultaResponse(loadFixture(testCase.consultaFile))
  const detalle = parseDetalleResponse(loadFixture(testCase.detalleFile))
  const actuacionesResponse = parseActuacionesResponse(
    loadFixture(testCase.actuacionesFile)
  )
  const cpnuProceso = consulta.procesos[0]

  return {
    cpnuProceso,
    detalle,
    actuacionesCpnu: actuacionesResponse.actuaciones,
  }
}

export function mapAdapterFixtureCase(testCase: AdapterFixtureCase): {
  cpnuProceso: CpnuProceso
  proceso: Proceso
  actuaciones: Actuacion[]
} {
  const { cpnuProceso, detalle, actuacionesCpnu } = loadAdapterFixtureCase(testCase)
  const mapped = cpnuProcesoCompleto(cpnuProceso, detalle, actuacionesCpnu, {
    id: `test-${testCase.slug}`,
  })

  return {
    cpnuProceso,
    ...mapped,
  }
}

export function expectAdapterRoundTrip(testCase: AdapterFixtureCase) {
  const { cpnuProceso, detalle, actuacionesCpnu } = loadAdapterFixtureCase(testCase)
  const { proceso, actuaciones } = mapAdapterFixtureCase(testCase)
  const partesEsperadas = parseSujetosProcesales(cpnuProceso.sujetosProcesales)

  expect(proceso.cpnuIdProceso).toBe(cpnuProceso.idProceso)
  expect(proceso.cpnuIdConexion).toBe(cpnuProceso.idConexion)
  expect(proceso.radicado).toBe(cpnuProceso.llaveProceso)
  expect(proceso.despacho).toBe(trimCpnuText(cpnuProceso.despacho) ?? cpnuProceso.despacho)
  expect(proceso.departamento).toBe(
    trimCpnuText(cpnuProceso.departamento) ?? cpnuProceso.departamento
  )
  expect(proceso.esPrivado).toBe(cpnuProceso.esPrivado)
  expect(proceso.fechaRadicacion).toBe(cpnuProceso.fechaProceso)
  expect(proceso.fechaUltimaActuacion).toBe(cpnuProceso.fechaUltimaActuacion)
  expect(proceso.partes).toHaveLength(partesEsperadas.length)

  for (const [index, parte] of partesEsperadas.entries()) {
    expect(proceso.partes[index].rol).toBe(parte.rol)
    expect(proceso.partes[index].nombre).toBe(parte.nombre)
    expect(proceso.partes[index].raw).toBe(parte.raw)
  }

  expect(proceso.ponente).toBe(trimCpnuText(detalle.ponente))
  expect(proceso.tipoProceso).toBe(trimCpnuText(detalle.tipoProceso))
  expect(proceso.claseProceso).toBe(trimCpnuText(detalle.claseProceso))
  expect(proceso.subclaseProceso).toBe(trimCpnuText(detalle.subclaseProceso))
  expect(proceso.recurso).toBe(trimCpnuText(detalle.recurso))
  expect(proceso.ubicacion).toBe(trimCpnuText(detalle.ubicacion))
  expect(proceso.ultimaActualizacion).toBe(detalle.ultimaActualizacion)

  expect(actuaciones).toHaveLength(actuacionesCpnu.length)

  const actuacionesOrdenadas = [...actuacionesCpnu].sort(
    (a, b) => b.consActuacion - a.consActuacion
  )

  for (const [index, cpnuActuacion] of actuacionesOrdenadas.entries()) {
    const actuacion = actuaciones[index]

    expect(actuacion.id).toBe(String(cpnuActuacion.idRegActuacion))
    expect(actuacion.procesoId).toBe(proceso.id)
    expect(actuacion.consActuacion).toBe(cpnuActuacion.consActuacion)
    expect(actuacion.fecha).toBe(cpnuActuacion.fechaActuacion)
    expect(actuacion.tipo).toBe(trimCpnuText(cpnuActuacion.actuacion) ?? cpnuActuacion.actuacion)
    expect(actuacion.descripcion).toBe(cpnuActuacion.anotacion)
    expect(actuacion.fechaRegistro).toBe(cpnuActuacion.fechaRegistro)
    expect(actuacion.conDocumentos).toBe(cpnuActuacion.conDocumentos)
  }
}
