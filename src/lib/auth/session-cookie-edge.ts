/** Edge-safe: lectura de cookie de sesion DB (sin Prisma ni server-only). */

export const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
] as const

function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  for (const part of header.split(";")) {
    const trimmed = part.trim()
    const separator = trimmed.indexOf("=")
    if (separator === -1) continue

    const key = trimmed.slice(0, separator)
    const value = trimmed.slice(separator + 1)
    cookies[key] = decodeURIComponent(value)
  }

  return cookies
}

export function readSessionTokenFromCookieHeader(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null

  const cookies = parseCookies(cookieHeader)

  for (const baseName of SESSION_COOKIE_NAMES) {
    if (cookies[baseName]) return cookies[baseName]

    const chunks: { index: number; value: string }[] = []

    for (const [name, value] of Object.entries(cookies)) {
      if (!name.startsWith(`${baseName}.`)) continue

      const index = Number.parseInt(name.slice(baseName.length + 1), 10)
      if (Number.isNaN(index)) continue

      chunks.push({ index, value })
    }

    if (chunks.length > 0) {
      chunks.sort((a, b) => a.index - b.index)
      return chunks.map((chunk) => chunk.value).join("")
    }
  }

  return null
}

export function readSessionTokenFromRequest(request: Request): string | null {
  return readSessionTokenFromCookieHeader(request.headers.get("cookie"))
}

export function hasSessionCookie(request: Request): boolean {
  return readSessionTokenFromRequest(request) != null
}
