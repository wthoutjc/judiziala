import { expect, test } from "@playwright/test"
import { loginBrowserContext } from "./helpers/auth"

test.describe("auth E2E", () => {
  test("login Google mock accede al dashboard", async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await loginBrowserContext(context)
    await page.goto("/dashboard")

    await expect(page).toHaveURL(/\/dashboard/)
    await context.close()
  })

  test("tras login y heartbeat /procesos permanece autenticado", async ({
    browser,
  }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await loginBrowserContext(context)
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/dashboard/)

    const heartbeat = await context.request.post("/api/heartbeat")
    expect(heartbeat.status()).toBe(204)

    await page.goto("/procesos")
    await expect(page).toHaveURL(/\/procesos/)

    await context.close()
  })

  test("sesion unica: segundo login revoca el primero", async ({ browser }) => {
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    await loginBrowserContext(contextA, { device: "E2E Device A" })
    await pageA.goto("/dashboard")
    await expect(pageA).toHaveURL(/\/dashboard/)

    await loginBrowserContext(contextB, { device: "E2E Device B" })

    const heartbeatA = await contextA.request.post("/api/heartbeat")
    expect(heartbeatA.status()).toBe(401)
    expect(await heartbeatA.json()).toEqual({ error: "session_revoked" })

    await pageB.goto("/dashboard")
    await expect(pageB).toHaveURL(/\/dashboard/)

    await contextA.close()
    await contextB.close()
  })

  test("sin sesion /procesos redirige a /login", async ({ page }) => {
    await page.goto("/procesos")
    await expect(page).toHaveURL(/\/login/)
  })

  test("logout-all revoca la sesion activa", async ({ browser }) => {
    const context = await browser.newContext()

    await loginBrowserContext(context)

    const logoutAll = await context.request.post("/api/session/logout-all")
    expect(logoutAll.ok()).toBeTruthy()

    const session = await context.request.get("/api/session")
    expect(session.status()).toBe(401)

    const heartbeat = await context.request.post("/api/heartbeat")
    expect(heartbeat.status()).toBe(401)

    await context.close()
  })
})
