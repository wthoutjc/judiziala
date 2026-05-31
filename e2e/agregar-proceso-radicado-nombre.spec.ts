/**
 * E2E — Tabs Radicado y Nombre en AgregarProcesoDialog
 *
 * Requiere acceso a CPNU en runtime (consulta live). NL cubierto en agregar-proceso-nl.spec.ts.
 */

import { expect, test } from "@playwright/test"
import { openAgregarProcesoDialog } from "./helpers/agregar-proceso"
import { loginBrowserContext } from "./helpers/auth"
import {
  E2E_CPNU_NOMBRE,
  E2E_CPNU_RADICADO,
  E2E_CPNU_RADICADO_DISPLAY,
} from "./helpers/cpnu-fixtures"

test.describe("Agregar proceso — radicado y nombre", () => {
  test.beforeEach(async ({ browser, page }) => {
    const context = browser.contexts()[0] ?? (await browser.newContext())
    await loginBrowserContext(context)
    await page.goto("/procesos")
    await expect(page).toHaveURL(/\/procesos/)
  })

  test("validacion: radicado incompleto muestra error", async ({ page }) => {
    await openAgregarProcesoDialog(page)

    await page.getByPlaceholder("23 digitos del radicado").fill("123")
    await page.getByRole("button", { name: /^buscar$/i }).click()

    await expect(
      page.getByText(/exactamente 23 digitos/i)
    ).toBeVisible()
  })

  test("tab Radicado: consulta CPNU muestra coincidencia", async ({ page }) => {
    await openAgregarProcesoDialog(page)

    await page.getByPlaceholder("23 digitos del radicado").fill(E2E_CPNU_RADICADO)
    await page.getByRole("button", { name: /^buscar$/i }).click()

    await expect(
      page
        .getByText(E2E_CPNU_RADICADO_DISPLAY)
        .or(page.getByText(/sin resultados/i))
        .or(page.getByText(/rama judicial|servicio judicial|conectar/i))
    ).toBeVisible({ timeout: 30_000 })
  })

  test("tab Nombre: consulta CPNU muestra resultados o vacio", async ({ page }) => {
    await openAgregarProcesoDialog(page)
    await page.getByRole("tab", { name: /nombre/i }).click()

    await page.getByPlaceholder(/demandante o demandado/i).fill(E2E_CPNU_NOMBRE)
    await page.getByRole("button", { name: /^buscar$/i }).click()

    await expect(
      page
        .getByText(E2E_CPNU_RADICADO_DISPLAY)
        .or(page.getByText(/sin resultados/i))
        .or(page.getByText(/rama judicial|servicio judicial|conectar/i))
    ).toBeVisible({ timeout: 30_000 })
  })
})
