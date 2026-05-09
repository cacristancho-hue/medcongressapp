// Server action higher-order helper.
// Replaces the 30-line "auth + ownership + quota + audit" boilerplate that
// every IA-flavored server action duplicates.
//
// Usage:
//   export const myAction = withAction({
//     name: "ai.image_analysis",
//     rateLimit: "image_analysis",
//     quota: "image_analysis",
//   })(async ({ user, supabase }, imageId: string) => {
//     // do stuff
//     return { someField: 42 }
//   })
//
//   // Caller side:
//   const result = await myAction("some-id")
//   if (!result.success) toast.error(result.error)
//   else use(result.someField)

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
  requiresAi?: boolean
}

export type ActionResult<T> =
  | ({ success: true } & T)
  | { success: false; error: string }

export function withAction(config: ActionConfig) {
  return function wrap<TInput, TOutput extends Record<string, unknown>>(
    handler: (ctx: ActionContext, input: TInput) => Promise<TOutput>
  ): (input: TInput) => Promise<ActionResult<TOutput>> {
    return async (input: TInput) => {
      const startedAt = Date.now()
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        log("warn", "action denied: no auth", { action: config.name })
        return { success: false, error: "No autorizado" }
      }

      if (config.requiresAi && process.env.MEDCONGRESS_AI_ENABLED !== "true") {
        return { success: false, error: "La IA está desactivada en este entorno." }
      }

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
