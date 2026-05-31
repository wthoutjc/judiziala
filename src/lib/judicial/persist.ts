import type { Prisma } from "@/generated/prisma/client"
import type { Actuacion, Proceso } from "./model"

type ProcesoDbRecord = Prisma.ProcesoGetPayload<{
  include: { sujetos: true; alertas: { select: { id: true } } }
}>

type ActuacionDbRecord = Prisma.ActuacionGetPayload<Record<string, never>>

function toIsoDate(value: Date): string {
  return value.toISOString()
}

export function mapDbProcesoToDomain(record: ProcesoDbRecord): Proceso {
  return {
    id: record.id,
    cpnuIdProceso: record.cpnuIdProceso,
    cpnuIdConexion: record.cpnuIdConexion,
    radicado: record.radicado,
    despacho: record.despacho,
    departamento: record.departamento,
    ponente: record.ponente ?? undefined,
    tipoProceso: record.tipoProceso ?? undefined,
    claseProceso: record.claseProceso ?? undefined,
    subclaseProceso: record.subclaseProceso ?? undefined,
    recurso: record.recurso ?? undefined,
    ubicacion: record.ubicacion ?? undefined,
    esPrivado: record.esPrivado,
    partes: record.sujetos.map((sujeto) => ({
      rol: sujeto.rol,
      nombre: sujeto.nombre,
      raw: sujeto.raw,
    })),
    fechaRadicacion: toIsoDate(record.fechaRadicacion),
    fechaUltimaActuacion: toIsoDate(record.fechaUltimaActuacion),
    ultimaActualizacion: record.ultimaActualizacion
      ? toIsoDate(record.ultimaActualizacion)
      : undefined,
    estado: record.estado,
    alertas: record.alertas.length,
  }
}

export function mapDbActuacionToDomain(record: ActuacionDbRecord): Actuacion {
  return {
    id: record.id,
    procesoId: record.procesoId,
    consActuacion: record.consActuacion,
    fecha: toIsoDate(record.fecha),
    tipo: record.tipo,
    descripcion: record.descripcion,
    fechaInicial: record.fechaInicial ? toIsoDate(record.fechaInicial) : null,
    fechaFinal: record.fechaFinal ? toIsoDate(record.fechaFinal) : null,
    fechaRegistro: toIsoDate(record.fechaRegistro),
    conDocumentos: record.conDocumentos,
    estado: record.estado,
  }
}

function mapProcesoFields(proceso: Proceso) {
  return {
    cpnuIdProceso: proceso.cpnuIdProceso,
    cpnuIdConexion: proceso.cpnuIdConexion,
    radicado: proceso.radicado,
    despacho: proceso.despacho,
    departamento: proceso.departamento,
    ponente: proceso.ponente,
    tipoProceso: proceso.tipoProceso,
    claseProceso: proceso.claseProceso,
    subclaseProceso: proceso.subclaseProceso,
    recurso: proceso.recurso,
    ubicacion: proceso.ubicacion,
    esPrivado: proceso.esPrivado,
    fechaRadicacion: new Date(proceso.fechaRadicacion),
    fechaUltimaActuacion: new Date(proceso.fechaUltimaActuacion),
    ultimaActualizacion: proceso.ultimaActualizacion
      ? new Date(proceso.ultimaActualizacion)
      : null,
    estado: proceso.estado,
  }
}

function mapProcesoToDbCreate(proceso: Proceso): Prisma.ProcesoCreateInput {
  const fields = mapProcesoFields(proceso)

  if (proceso.id.startsWith("cpnu-")) {
    return fields
  }

  return { id: proceso.id, ...fields }
}

function mapActuacionToDb(
  actuacion: Actuacion,
  procesoId: string
): Prisma.ActuacionUncheckedCreateInput {
  return {
    id: actuacion.id,
    procesoId,
    consActuacion: actuacion.consActuacion,
    fecha: new Date(actuacion.fecha),
    tipo: actuacion.tipo,
    descripcion: actuacion.descripcion,
    fechaInicial: actuacion.fechaInicial ? new Date(actuacion.fechaInicial) : null,
    fechaFinal: actuacion.fechaFinal ? new Date(actuacion.fechaFinal) : null,
    fechaRegistro: new Date(actuacion.fechaRegistro),
    conDocumentos: actuacion.conDocumentos,
    estado: actuacion.estado,
  }
}

export async function persistProcesoFromDomain(
  tx: Prisma.TransactionClient,
  proceso: Proceso,
  actuaciones: Actuacion[]
): Promise<string> {
  const updateData = mapProcesoFields(proceso)

  const dbProceso = await tx.proceso.upsert({
    where: { cpnuIdProceso: proceso.cpnuIdProceso },
    create: mapProcesoToDbCreate(proceso),
    update: updateData,
  })

  await tx.sujeto.deleteMany({ where: { procesoId: dbProceso.id } })

  if (proceso.partes.length > 0) {
    await tx.sujeto.createMany({
      data: proceso.partes.map((parte) => ({
        procesoId: dbProceso.id,
        rol: parte.rol,
        nombre: parte.nombre,
        raw: parte.raw,
      })),
    })
  }

  for (const actuacion of actuaciones) {
    const actuacionData = mapActuacionToDb(
      { ...actuacion, procesoId: dbProceso.id },
      dbProceso.id
    )

    await tx.actuacion.upsert({
      where: { id: actuacion.id },
      create: actuacionData,
      update: actuacionData,
    })
  }

  return dbProceso.id
}
