// Feature flags client. Resolves a flag key to a boolean using the DB function
// `public.is_feature_enabled` which respects user/org overrides + rollout %.
//
// Per-request memoization keeps repeated checks cheap inside a single render.

import { createClient } from "@/lib/supabase/server"

const cache = new Map<string, { value: boolean; expiresAt: number }>()
const TTL_MS = 30_000

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("is_feature_enabled", { p_flag_key: key })

  if (error) {
    console.warn(`[feature-flags] resolve failed for "${key}":`, error.message)
    return false
  }

  const value = Boolean(data)
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS })
  return value
}

/** Resolve multiple flags in parallel. */
export async function isAnyFeatureEnabled(...keys: string[]): Promise<Record<string, boolean>> {
  const entries = await Promise.all(
    keys.map(async (k) => [k, await isFeatureEnabled(k)] as const)
  )
  return Object.fromEntries(entries)
}
