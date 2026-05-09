// Postgres-backed token bucket rate limiter.
// Used to protect AI server actions from abuse beyond the per-month quota:
// even within quota, a user shouldn't fire 200 requests per minute.

import { createClient } from "@/lib/supabase/server"

export type RateLimitBucket =
  | "image_analysis"
  | "report_generation"
  | "assistant_run"
  | "reference_verify"
  | "auth_signup"
  | "auth_login"

interface RateLimitPolicy {
  maxHits: number
  windowSeconds: number
}

// Defaults tuned for MVP. Tighten later when we see real abuse patterns.
const POLICIES: Record<RateLimitBucket, RateLimitPolicy> = {
  image_analysis:    { maxHits: 30,  windowSeconds: 60 },     // 30/min
  report_generation: { maxHits: 5,   windowSeconds: 60 * 5 }, // 5 / 5min
  assistant_run:     { maxHits: 3,   windowSeconds: 60 * 5 }, // 3 / 5min
  reference_verify:  { maxHits: 10,  windowSeconds: 60 },     // 10/min
  auth_signup:       { maxHits: 5,   windowSeconds: 60 * 60 }, // 5/hour
  auth_login:        { maxHits: 20,  windowSeconds: 60 * 15 }, // 20 / 15min
}

export interface RateLimitResult {
  allowed: boolean
  bucket: RateLimitBucket
  policy: RateLimitPolicy
}

/**
 * Atomic check + increment in Postgres.
 * Fails-open if the DB call errors (we don't want infra issues to block users).
 */
export async function checkRateLimit(
  userId: string,
  bucket: RateLimitBucket
): Promise<RateLimitResult> {
  const policy = POLICIES[bucket]
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("rate_limit_check", {
      p_user_id: userId,
      p_bucket_key: bucket,
      p_max_hits: policy.maxHits,
      p_window_secs: policy.windowSeconds,
    })

    if (error) {
      console.warn("[rate-limit] db call failed; failing open:", error.message)
      return { allowed: true, bucket, policy }
    }

    return { allowed: Boolean(data), bucket, policy }
  } catch (err) {
    console.warn(
      "[rate-limit] unexpected failure; failing open:",
      err instanceof Error ? err.message : String(err)
    )
    return { allowed: true, bucket, policy }
  }
}

export function rateLimitMessage(result: RateLimitResult): string {
  const { policy } = result
  return `Demasiadas solicitudes. Máximo ${policy.maxHits} cada ${
    policy.windowSeconds >= 60 ? `${policy.windowSeconds / 60} minutos` : `${policy.windowSeconds} segundos`
  }. Intenta de nuevo en un momento.`
}
