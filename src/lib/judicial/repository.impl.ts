import type { Prisma, PrismaClient } from "@/generated/prisma/client"
import { cpnuProcesoCompleto } from "./adapter"
import type { CpnuActuacion } from "./cpnu.schemas"
import type { CpnuClient } from "./cpnu-client.impl"
import type { Actuacion, Proceso } from "./model"
import {
  mapDbActuacionToDomain,
  mapDbProcesoToDomain,
  persistProcesoFromDomain,
} from "./persist"

export type ProcesoRepositoryErrorCode =
  | "NOT_MONITORED"
  | "CPNU_PROCESO_NOT_FOUND"

export class ProcesoRepositoryError extends Error {
  readonly code: ProcesoRepositoryErrorCode

  constructor(message: string, code: ProcesoRepositoryErrorCode) {
    super(message)
    this.name = "ProcesoRepositoryError"
    this.code = code
  }
}

export type ProcesoRepositoryDeps = {
  db: PrismaClient
  cpnuClient: CpnuClient
}

export type ProcesoDetalle = {
  proceso: Proceso
  actuaciones: Actuacion[]
}

const procesoIncludeForUser = (userId: string) =>
  ({
    sujetos: { orderBy: { rol: "asc" as const } },
    alertas: {
      where: { userId, leida: false },
      select: { id: true },
    },
  }) satisfies Prisma.ProcesoInclude

export class ProcesoRepository {
  constructor(private readonly deps: ProcesoRepositoryDeps) {}

  async listar(userId: string): Promise<Proceso[]> {
    const monitoreos = await this.deps.db.monitoreoProceso.findMany({
      where: { userId },
      include: {
        proceso: {
          include: procesoIncludeForUser(userId),
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return monitoreos.map((monitoreo) => mapDbProcesoToDomain(monitoreo.proceso))
  }

  async obtener(userId: string, procesoId: string): Promise<ProcesoDetalle> {
    const monitoreo = await this.deps.db.monitoreoProceso.findUnique({
      where: { userId_procesoId: { userId, procesoId } },
      include: {
        proceso: {
          include: {
            ...procesoIncludeForUser(userId),
            actuaciones: { orderBy: { consActuacion: "desc" } },
          },
        },
      },
    })

    if (!monitoreo) {
      throw new ProcesoRepositoryError(
        "Proceso no monitoreado por el usuario",
        "NOT_MONITORED"
      )
    }

    return {
      proceso: mapDbProcesoToDomain(monitoreo.proceso),
      actuaciones: monitoreo.proceso.actuaciones.map(mapDbActuacionToDomain),
    }
  }

  async monitorear(userId: string, cpnuIdProceso: number): Promise<Proceso> {
    const [detalle, actuacionesCpnu] = await Promise.all([
      this.deps.cpnuClient.detalle(cpnuIdProceso),
      this.fetchAllActuaciones(cpnuIdProceso),
    ])

    const consulta = await this.deps.cpnuClient.porRadicado(detalle.llaveProceso)
    const cpnuProceso = consulta.procesos.find(
      (proceso) => proceso.idProceso === cpnuIdProceso
    )

    if (!cpnuProceso) {
      throw new ProcesoRepositoryError(
        "Proceso no encontrado en CPNU para el radicado consultado",
        "CPNU_PROCESO_NOT_FOUND"
      )
    }

    const { proceso, actuaciones } = cpnuProcesoCompleto(
      cpnuProceso,
      detalle,
      actuacionesCpnu
    )

    const persistedId = await this.deps.db.$transaction(async (tx) => {
      const id = await persistProcesoFromDomain(tx, proceso, actuaciones)

      await tx.monitoreoProceso.upsert({
        where: { userId_procesoId: { userId, procesoId: id } },
        create: { userId, procesoId: id },
        update: {},
      })

      return id
    })

    const detail = await this.obtener(userId, persistedId)
    return detail.proceso
  }

  async dejarDeMonitorear(userId: string, procesoId: string): Promise<void> {
    await this.deps.db.monitoreoProceso.deleteMany({
      where: { userId, procesoId },
    })
  }

  private async fetchAllActuaciones(cpnuIdProceso: number): Promise<CpnuActuacion[]> {
    const firstPage = await this.deps.cpnuClient.actuaciones(cpnuIdProceso, {
      pagina: 1,
    })

    const actuaciones = [...firstPage.actuaciones]
    const totalPages = firstPage.paginacion.cantidadPaginas

    for (let pagina = 2; pagina <= totalPages; pagina++) {
      const page = await this.deps.cpnuClient.actuaciones(cpnuIdProceso, { pagina })
      actuaciones.push(...page.actuaciones)
    }

    return actuaciones
  }
}

export function createProcesoRepository(deps: ProcesoRepositoryDeps): ProcesoRepository {
  return new ProcesoRepository(deps)
}
