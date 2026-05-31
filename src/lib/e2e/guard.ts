export const E2E_USER_EMAIL = "e2e@judiziala.local"

export function isE2eEnabled(): boolean {
  return (
    process.env.E2E_ENABLED === "true" &&
    process.env.NODE_ENV !== "production"
  )
}

export function e2eNotFoundResponse(): Response {
  return new Response("Not Found", { status: 404 })
}
