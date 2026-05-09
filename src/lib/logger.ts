// Structured logging + audit trail.
// Two surfaces:
//   1. log()         → stdout JSON for ops (Vercel/Sentry will pick it up)
//   2. auditLog()    → row in public.audit_log (compliance, user-visible history)
//
// Both are async-safe and never throw. If audit_log insert fails we log
// to stdout instead of breaking the caller.

import { createClient } from "@/lib/supabase/server"

export type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  userId?: string
  organizationId?: string
  resourceType?: string
  resourceId?: string
  [key: string]: unknown
}

export function log(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...context,
  }
  // JSON one-liner so log aggregators (Vercel, Sentry, Datadog) can parse it.
  const payload = JSON.stringify(entry)
  if (level === "error") console.error(payload)
  else if (level === "warn") console.warn(payload)
  else console.log(payload)
}

export type AuditAction =
  | "auth.login"
  | "auth.signout"
  | "congress.create"
  | "congress.update"
  | "congress.delete"
  | "image.upload"
  | "image.delete"
  | "image.delete_batch"
  | "ai.image_analysis"
  | "ai.report_generation"
  | "ai.topics_extraction"
  | "ai.assistant_run"
  | "ai.quota_blocked"
  | "reference.verify"
  | "report.update"
  | "profile.update"
  | "organization.create"
  | "membership.invite"
  | "membership.remove"
  | "billing.upgrade"
  | "billing.downgrade"
  | "admin.override"

export type AuditStatus = "success" | "denied" | "error"

export interface AuditInput {
  userId: string
  organizationId?: string | null
  action: AuditAction
  resourceType?: string
  resourceId?: string
  status?: AuditStatus
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Persist an audit row. Never throws. If the DB insert fails, falls back
 * to console.error so the event isn't lost.
 */
export async function auditLog(input: AuditInput): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("audit_log").insert({
      user_id: input.userId,
      organization_id: input.organizationId ?? null,
      action: input.action,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      status: input.status ?? "success",
      metadata: input.metadata ?? {},
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    })

    if (error) {
      log("error", "audit_log insert failed", {
        userId: input.userId,
        action: input.action,
        dbError: error.message,
      })
    }
  } catch (err) {
    log("error", "audit_log unexpected failure", {
      userId: input.userId,
      action: input.action,
      err: err instanceof Error ? err.message : String(err),
    })
  }
}
