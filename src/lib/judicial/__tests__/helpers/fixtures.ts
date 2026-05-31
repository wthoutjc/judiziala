import { readFileSync } from "node:fs"
import { join } from "node:path"

export const CPNU_TEST_ID_PROCESO = 29498455
export const CPNU_TEST_RADICADO = "05001600020620201819700"
export const CPNU_TEST_NOMBRE = "EDIBER CEFERINO RINCON"

const fixturesDir = join(__dirname, "..", "..", "__fixtures__")

export function loadFixture(name: string): unknown {
  const raw = readFileSync(join(fixturesDir, name), "utf8")
  return JSON.parse(raw)
}

export type FixtureRoute = {
  pathIncludes: string
  fixture: string
}

export function createFixtureFetch(routes: FixtureRoute[]): typeof fetch {
  return async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString()
    const route = routes.find(({ pathIncludes }) => url.includes(pathIncludes))

    if (!route) {
      return new Response(
        JSON.stringify({ message: `Unexpected CPNU URL in test: ${url}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    return Response.json(loadFixture(route.fixture))
  }
}
