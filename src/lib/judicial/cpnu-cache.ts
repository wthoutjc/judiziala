import "server-only"

import { unstable_cache } from "next/cache"
import {
  buildCpnuCacheKey,
  CPNU_CACHE_TTL_SECONDS,
} from "./cpnu-cache-keys"

export { buildCpnuCacheKey, CPNU_CACHE_TTL_SECONDS }

export function cacheCpnuFetch<T>(
  key: string[],
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = unstable_cache(fetcher, key, {
    revalidate: CPNU_CACHE_TTL_SECONDS,
    tags: key.slice(0, 2),
  })

  return cached()
}
