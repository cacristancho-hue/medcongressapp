// Server action higher-order helper.
// Replaces the 30-line "auth + ownership + quota + audit" boilerplate that
// every IA-flavored server action duplicates.
//
// Usage:
//   export const myAction = withAction({
//     name: "ai.image_analysis",
//     rateLimit: "image_analysis",
//     quota: "image_analysis",
//   })(async ({ user, supabase }, payload: { imageId: string }) => {
//     ...
//     return { success: true }
//   })

import { createClient } from "@/lib/supabase/server"
import { auditLog, log, type AuditAction } from "@/lib/logger"
import { checkRateLimit, rateLimitMessage, type RateLimitBucket } from "@/lib/rate-limit"
import { checkAiQuota, recordAiUsage, type AiActionType } from "@/lib/ai-usage"
import type { SupabaseClient, User } from "@supabase/supabase-js"

export interface ActionContext {
  user: User
  supabase: SupabaseClient
}

export interface ActionConfig {
  name: AuditAction
  rateLimit?: RateLimitBucket
  quota?: AiActionType
  // If true, action is denied when AI feature flag is off.
  requiresAi?: boolean
}

export type ActionResult<T> =
  | ({ success: true } & T)
  | { success: false; error: string }

type ActionHandler<TInput, TOutput> = (
  ctx: ActionContext,
  input: TInput
) => Promise<TOutput>

export function withAction<TInput, TOutput extends Record<string, unknown>>(
  config: ActionConfig
) {
  return (handler: ActionHandler<TInput, TOutput>) => {
    return async (input: TInput): Promise<ActionResult<TOutput>> => {
      const startedAt = Date.now()
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        log("warn", "action denied: no auth", { action: config.name })
        return { success: false, error: "No autorizado" }
      }

      // AI feature flag gate.
      if (config.requiresAi && process.env.MEDCONGRESS_AI_ENABLED !== "true") {
        return { success: false, error: "La IA está desactivada en este entorno." }
      }

      // Rate limit.
      if (config.rateLimit) {
        const rl = await checkRateLimit(user.id, config.rateLimit)
        if (!rl.allowed) {
          await auditLog({
            userId: user.id,
            action: config.name,
            status: "denied",
            metadata: { reason: "rate_limited", bucket: rl.bucket },
          })
          return { success: false, error: rateLimitMessage(rl) }
        }
      }

      // Monthly quota.
      if (config.quota) {
        const quota = await checkAiQuota(user.id, config.quota)
        if (!quota.allowed) {
          await recordAiUsage({
            userId: user.id,
            actionType: config.quota,
            model: "blocked-by-wrapper",
            status: "blocked",
            errorMessage: quota.reason ?? "quota exceeded",
          })
          await auditLog({
            userId: user.id,
            action: config.name,
            status: "denied",
            metadata: { reason: "quota_exceeded" },
          })
          return { success: false, error: quota.reason ?? "Cuota excedida" }
        }
      }

      try {
        const out = await handler({ user, supabase }, input)
        await auditLog({
          userId: user.id,
          action: config.name,
          status: "success",
          metadata: { duration_ms: Date.now() - startedAt },
        })
        return { success: true, ...out } as ActionResult<TOutput>
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido"
        log("error", "action failed", {
          action: config.name,
          userId: user.id,
          err: message,
          duration_ms: Date.now() - startedAt,
        })
        await auditLog({
          userId: user.id,
          action: config.name,
          status: "error",
          metadata: { error: message },
        })
        return { success: false, error: message }
      }
    }
  }
}
