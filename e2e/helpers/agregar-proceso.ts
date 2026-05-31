import { expect, type Page } from "@playwright/test"

export async function openAgregarProcesoDialog(page: Page) {
  await page.getByTestId("agregar-proceso-open").click()
  await expect(page.getByRole("dialog")).toBeVisible()
}
