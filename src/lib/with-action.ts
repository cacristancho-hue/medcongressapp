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

export interface IdempotentInput {
  /**
   * Optional client-supplied idempotency key. If present, the wrapper
   * deduplicates retries: a second call with the same key returns the
   * cached result instead of re-executing the handler.
   */
  idempotencyKey?: string
}

export type ActionResult<T> =
  | ({ success: true } & T)
  | { success: false; error: string }

export function withAction(config: ActionConfig) {
  return function wrap<TInput, TOutput extends object>(
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

      if (config.requiresAi && process.env.MEDCONGRESS_AI_ENABLED === "false") {
        return { success: false, error: "La IA está temporalmente desactivada." }
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

      // Idempotency: if the input carries an idempotencyKey, dedupe.
      const idempotencyKey =
        typeof input === "object" && input !== null && "idempotencyKey" in input
          ? (input as IdempotentInput).idempotencyKey
          : undefined

      if (idempotencyKey) {
        const { data: existing } = await supabase
          .from("idempotency_keys")
          .select("status, result, error_message")
          .eq("key", idempotencyKey)
          .eq("user_id", user.id)
          .maybeSingle()

        if (existing) {
          if (existing.status === "succeeded" && existing.result) {
            return existing.result as ActionResult<TOutput>
          }
          if (existing.status === "processing") {
            return {
              success: false,
              error: "Solicitud en curso, espera un momento.",
            }
          }
          if (existing.status === "failed") {
            return {
              success: false,
              error: existing.error_message ?? "Error previo en esta solicitud.",
            }
          }
        }

        // Reserve the key as 'processing' (best-effort; ignore conflict).
        await supabase
          .from("idempotency_keys")
          .insert({
            key: idempotencyKey,
            user_id: user.id,
            action: config.name,
            status: "processing",
          })
      }

      try {
        const out = await handler({ user, supabase }, input)
        await auditLog({
          userId: user.id,
          action: config.name,
          status: "success",
          metadata: { duration_ms: Date.now() - startedAt },
        })
        const finalResult = { success: true, ...out } as ActionResult<TOutput>
        if (idempotencyKey) {
          await supabase
            .from("idempotency_keys")
            .update({
              status: "succeeded",
              result: finalResult,
              finished_at: new Date().toISOString(),
            })
            .eq("key", idempotencyKey)
            .eq("user_id", user.id)
        }
        return finalResult
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
        if (idempotencyKey) {
          await supabase
            .from("idempotency_keys")
            .update({
              status: "failed",
              error_message: message,
              finished_at: new Date().toISOString(),
            })
            .eq("key", idempotencyKey)
            .eq("user_id", user.id)
        }
        return { success: false, error: message }
      }
    }
  }
}
