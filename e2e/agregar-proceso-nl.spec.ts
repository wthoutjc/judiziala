/**
 * E2E — Tab Lenguaje Natural en AgregarProcesoDialog
 *
 * Cobertura:
 *   1. Tab NL accesible (no disabled)
 *   2. Validacion de texto corto (<5 chars)
 *   3. Estado de carga al interpretar (spinner + "Interpretando...")
 *   4. Manejo de error cuando ANTHROPIC_API_KEY no esta configurada en E2E
 *   5. Navegacion entre tabs sin perder estado del radicado
 *
 * Nota sobre wildcards CPNU:
 *   La API CPNU /NumeroRadicacion NO acepta busqueda parcial por radicado
 *   (spike 2026-05-31: 05001 funciona como codificacionDespacho; radicados
 *   parciales retornan 404). No implementar ni documentar wildcards de radicado
 *   como feature soportado.
 *
 * Prueba de integracion completa (interpretar -> chips -> CPNU):
 *   Requiere ANTHROPIC_API_KEY y acceso a CPNU. Cubrir en suite de integracion
 *   separada con variables de entorno CI dedicadas, no en este spec E2E.
 */

import { expect, test } from "@playwright/test"
import { openAgregarProcesoDialog } from "./helpers/agregar-proceso"
import { loginBrowserContext } from "./helpers/auth"

test.describe("Agregar proceso — tab Lenguaje natural", () => {
  test.beforeEach(async ({ browser, page }) => {
    const context = browser.contexts()[0] ?? (await browser.newContext())
    await loginBrowserContext(context)
    await page.goto("/procesos")
    await expect(page).toHaveURL(/\/procesos/)
  })

  test("el tab NL es visible y clickeable", async ({ page }) => {
    await openAgregarProcesoDialog(page)

    const tabNl = page.getByRole("tab", { name: /lenguaje natural/i })
    await expect(tabNl).toBeVisible()
    await expect(tabNl).not.toBeDisabled()

    await tabNl.click()
    await expect(tabNl).toHaveAttribute("aria-selected", "true")
  })

  test("muestra textarea y boton Interpretar al activar tab NL", async ({ page }) => {
    await openAgregarProcesoDialog(page)
    await page.getByRole("tab", { name: /lenguaje natural/i }).click()

    await expect(page.getByPlaceholder(/garcia.*zurich|procesos de/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /interpretar/i })).toBeVisible()
  })

  test("validacion: texto muy corto muestra error", async ({ page }) => {
    await openAgregarProcesoDialog(page)
    await page.getByRole("tab", { name: /lenguaje natural/i }).click()

    const textarea = page.getByPlaceholder(/garcia.*zurich|procesos de/i)
    await textarea.fill("hola")
    await page.getByRole("button", { name: /interpretar/i }).click()

    await expect(page.getByText(/al menos 5 caracteres/i)).toBeVisible()
  })

  test("clic en Interpretar con texto valido muestra estado de carga", async ({ page }) => {
    await openAgregarProcesoDialog(page)
    await page.getByRole("tab", { name: /lenguaje natural/i }).click()

    const textarea = page.getByPlaceholder(/garcia.*zurich|procesos de/i)
    await textarea.fill("Procesos de Garcia contra Zurich en Medellin desde 2022")

    await page.getByRole("button", { name: /interpretar/i }).click()

    await expect(
      page.getByRole("button", { name: /interpretando/i }).or(
        page.getByText(/servicio de interpretacion|no esta disponible|api_error/i)
      )
    ).toBeVisible({ timeout: 15_000 })
  })

  test("error de interpretacion muestra mensaje amigable", async ({ page }) => {
    await openAgregarProcesoDialog(page)
    await page.getByRole("tab", { name: /lenguaje natural/i }).click()

    await page.getByPlaceholder(/garcia.*zurich|procesos de/i).fill(
      "Procesos laborales de Rincon en Bogota"
    )
    await page.getByRole("button", { name: /interpretar/i }).click()

    await expect(page.getByRole("button", { name: /interpretar/i })).toBeEnabled({
      timeout: 20_000,
    })

    const errorVisible = await page
      .getByText(/servicio de interpretacion|no esta disponible/i)
      .isVisible()
      .catch(() => false)

    const chipsVisible = await page
      .getByText(/busqueda interpretada/i)
      .isVisible()
      .catch(() => false)

    expect(errorVisible || chipsVisible).toBe(true)
  })

  test("cambiar al tab Radicado y volver al NL mantiene el texto", async ({ page }) => {
    await openAgregarProcesoDialog(page)
    await page.getByRole("tab", { name: /lenguaje natural/i }).click()

    const textarea = page.getByPlaceholder(/garcia.*zurich|procesos de/i)
    await textarea.fill("Procesos de Garcia en Bogota")

    await page.getByRole("tab", { name: /radicado/i }).click()
    await expect(page.getByRole("tab", { name: /radicado/i })).toHaveAttribute(
      "aria-selected",
      "true"
    )

    await page.getByRole("tab", { name: /lenguaje natural/i }).click()
    await expect(textarea).toHaveValue("Procesos de Garcia en Bogota")
  })

  test("cerrar el dialog limpia el estado NL", async ({ page }) => {
    await openAgregarProcesoDialog(page)
    await page.getByRole("tab", { name: /lenguaje natural/i }).click()
    await page.getByPlaceholder(/garcia.*zurich|procesos de/i).fill("Texto de prueba")

    await page.getByRole("button", { name: /cerrar/i }).click()
    await expect(page.getByRole("dialog")).not.toBeVisible()

    await openAgregarProcesoDialog(page)
    await page.getByRole("tab", { name: /lenguaje natural/i }).click()
    await expect(page.getByPlaceholder(/garcia.*zurich|procesos de/i)).toHaveValue("")
  })
})
