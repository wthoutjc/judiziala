import "server-only"

import { db } from "@/lib/db"
import { cpnuClient } from "./cpnu-client"
import {
  createProcesoRepository as createProcesoRepositoryImpl,
  ProcesoRepository,
  ProcesoRepositoryError,
  type ProcesoDetalle,
  type ProcesoRepositoryDeps,
  type ProcesoRepositoryErrorCode,
} from "./repository.impl"

export {
  ProcesoRepository,
  ProcesoRepositoryError,
  type ProcesoDetalle,
  type ProcesoRepositoryDeps,
  type ProcesoRepositoryErrorCode,
}

export function createProcesoRepository(
  deps: Partial<ProcesoRepositoryDeps> = {}
): ProcesoRepository {
  return createProcesoRepositoryImpl({
    db: deps.db ?? db,
    cpnuClient: deps.cpnuClient ?? cpnuClient,
  })
}

export const procesoRepository = createProcesoRepository()

export {
  mapDbActuacionToDomain,
  mapDbProcesoToDomain,
  persistProcesoFromDomain,
} from "./persist"
