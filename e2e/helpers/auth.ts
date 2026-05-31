import type { APIRequestContext, BrowserContext } from "@playwright/test"
import { expect } from "@playwright/test"

export type MockGoogleLoginOptions = {
  device?: string
}

export async function mockGoogleLogin(
  request: APIRequestContext,
  options: MockGoogleLoginOptions = {},
) {
  const response = await request.post("/api/e2e/mock-google-login", {
    data: options.device ? { device: options.device } : {},
  })

  expect(response.status(), "mock-google-login should succeed").toBe(200)
  return response.json() as Promise<{ sessionToken: string; userId: string }>
}

export async function loginBrowserContext(
  context: BrowserContext,
  options: MockGoogleLoginOptions = {},
) {
  return mockGoogleLogin(context.request, options)
}
