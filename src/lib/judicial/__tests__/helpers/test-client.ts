import {
  createCpnuClient,
  type CpnuClient,
} from "../../cpnu-client.impl"
import {
  createFixtureFetch,
  type FixtureRoute,
} from "./fixtures"

const fixtureRoutes: FixtureRoute[] = [
  {
    pathIncludes: "/api/v2/Procesos/Consulta/NumeroRadicacion",
    fixture: "consulta-radicado.json",
  },
  {
    pathIncludes: "/api/v2/Procesos/Consulta/NombreRazonSocial",
    fixture: "consulta-nombre.json",
  },
  {
    pathIncludes: "/api/v2/Proceso/Detalle/",
    fixture: "detalle-proceso.json",
  },
  {
    pathIncludes: "/api/v2/Proceso/Actuaciones/",
    fixture: "actuaciones-proceso.json",
  },
]

function createBaseClient(overrides: Parameters<typeof createCpnuClient>[0] = {}) {
  return createCpnuClient({
    rateLimiter: null,
    circuitBreaker: null,
    cacheFetch: undefined,
    ...overrides,
  })
}

export function createFixtureClient(): CpnuClient {
  return createBaseClient({
    fetchImpl: createFixtureFetch(fixtureRoutes),
  })
}

export function createLiveClient(): CpnuClient {
  return createBaseClient()
}
