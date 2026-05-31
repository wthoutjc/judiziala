import { describe, expect, it } from "vitest"
import { handleRouteAuthorization } from "@/auth.config"

function makeRequest(pathname: string) {
  return { nextUrl: new URL(`http://localhost${pathname}`) }
}

describe("handleRouteAuthorization", () => {
  it("bloquea rutas protegidas sin sesion", () => {
    expect(
      handleRouteAuthorization({
        auth: null,
        request: makeRequest("/procesos"),
      })
    ).toBe(false)
  })

  it("permite rutas protegidas con sesion", () => {
    expect(
      handleRouteAuthorization({
        auth: { user: { id: "user-1" } },
        request: makeRequest("/procesos"),
      })
    ).toBe(true)
  })

  it("redirige /login a /dashboard si ya hay sesion", () => {
    const result = handleRouteAuthorization({
      auth: { user: { id: "user-1" } },
      request: makeRequest("/login"),
    })

    expect(result).toBeInstanceOf(Response)
    expect((result as Response).headers.get("location")).toBe(
      "http://localhost/dashboard"
    )
  })

  it("deja /sesion-cerrada publica", () => {
    expect(
      handleRouteAuthorization({
        auth: null,
        request: makeRequest("/sesion-cerrada"),
      })
    ).toBe(true)
  })

  it("deja / publico sin sesion", () => {
    expect(
      handleRouteAuthorization({
        auth: null,
        request: makeRequest("/"),
      })
    ).toBe(true)
  })
})
