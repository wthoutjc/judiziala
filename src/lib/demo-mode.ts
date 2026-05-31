/** Demo auth: solo local dev; nunca en producción (Credentials no usa sesiones DB). */
export function isDemoAuthEnabled() {
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" &&
    process.env.NODE_ENV === "development"
  )
}

/** UI login: mismo criterio que isDemoAuthEnabled (seguro en bundle de prod). */
export function isDemoMode() {
  return isDemoAuthEnabled()
}
