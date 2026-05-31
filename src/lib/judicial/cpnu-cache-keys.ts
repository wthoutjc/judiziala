export const CPNU_CACHE_TTL_SECONDS = 900

export function buildCpnuCacheKey(
  path: string,
  searchParams?: Record<string, string | number | boolean>
): string[] {
  const key = ["cpnu", path]

  if (searchParams) {
    const entries = Object.entries(searchParams).sort(([a], [b]) =>
      a.localeCompare(b)
    )

    for (const [param, value] of entries) {
      key.push(`${param}=${String(value)}`)
    }
  }

  return key
}
