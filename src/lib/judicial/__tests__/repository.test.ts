import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  createProcesoRepository,
  ProcesoRepositoryError,
} from "../repository.impl"
import { createFixtureClient } from "./helpers/test-client"
import { createTestDb } from "./helpers/test-db"
import { CPNU_TEST_ID_PROCESO } from "./helpers/fixtures"

describe.sequential("ProcesoRepository scoped", () => {
  const runId = Date.now()
  const emailA = `repo-scope-a-${runId}@test.local`
  const emailB = `repo-scope-b-${runId}@test.local`

  let pool: ReturnType<typeof createTestDb>["pool"]
  let db: ReturnType<typeof createTestDb>["db"]
  let repository: ReturnType<typeof createProcesoRepository>
  let userAId: string
  let userBId: string
  let procesoId: string

  beforeAll(async () => {
    ;({ db, pool } = createTestDb())
    repository = createProcesoRepository({
      db,
      cpnuClient: createFixtureClient(),
    })

    const [userA, userB] = await Promise.all([
      db.user.create({
        data: { email: emailA, name: "Repository User A", role: "ABOGADO" },
      }),
      db.user.create({
        data: { email: emailB, name: "Repository User B", role: "ABOGADO" },
      }),
    ])

    userAId = userA.id
    userBId = userB.id
  })

  afterAll(async () => {
    if (procesoId) {
      await db.monitoreoProceso.deleteMany({
        where: { userId: { in: [userAId, userBId] }, procesoId },
      })
    }

    await db.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    })

    await pool.end()
  })

  it("monitorear persiste proceso y lo expone solo al usuario dueño", async () => {
    const proceso = await repository.monitorear(userAId, CPNU_TEST_ID_PROCESO)
    procesoId = proceso.id

    const listaA = await repository.listar(userAId)
    const listaB = await repository.listar(userBId)

    expect(listaA.some((item) => item.id === proceso.id)).toBe(true)
    expect(listaB.some((item) => item.id === proceso.id)).toBe(false)

    await expect(repository.obtener(userBId, proceso.id)).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof ProcesoRepositoryError && error.code === "NOT_MONITORED"
    )
  })

  it("monitorear es idempotente para el mismo usuario y proceso global", async () => {
    const first = await repository.monitorear(userAId, CPNU_TEST_ID_PROCESO)
    const second = await repository.monitorear(userAId, CPNU_TEST_ID_PROCESO)

    expect(second.id).toBe(first.id)
    expect(second.radicado).toBe(first.radicado)

    const monitoreos = await db.monitoreoProceso.findMany({
      where: { userId: userAId, procesoId: first.id },
    })
    const procesos = await db.proceso.findMany({
      where: { cpnuIdProceso: CPNU_TEST_ID_PROCESO },
    })

    expect(monitoreos).toHaveLength(1)
    expect(procesos).toHaveLength(1)
  })

  it("dos usuarios pueden monitorear el mismo proceso global con links separados", async () => {
    const procesoB = await repository.monitorear(userBId, CPNU_TEST_ID_PROCESO)

    expect(procesoB.id).toBe(procesoId)

    const links = await db.monitoreoProceso.findMany({
      where: {
        procesoId,
        userId: { in: [userAId, userBId] },
      },
    })

    expect(links).toHaveLength(2)
    expect(links.map((link) => link.userId).sort()).toEqual(
      [userAId, userBId].sort()
    )
  })
})
