// Webhook dispatcher.
// Pattern (Stripe-like):
//   1. Caller invokes dispatchWebhook(event, payload, scope)
//   2. We find every enabled endpoint subscribed to that event in scope
//   3. We enqueue webhook_deliveries rows for each (worker delivers them async)
//   4. Worker signs the payload with HMAC-SHA256 (header X-MedCongress-Signature)
//   5. Retry exponential backoff up to max_attempts; failed becomes 'failed'

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { log } from "@/lib/logger"
import { createHmac, randomBytes } from "node:crypto"

export type WebhookEvent =
  | "congress.created"
  | "congress.deleted"
  | "image.uploaded"
  | "image.analyzed"
  | "report.generated"
  | "references.verified"
  | "billing.upgraded"

interface DispatchInput {
  event: WebhookEvent
  payload: Record<string, unknown>
  organizationId?: string | null
  userId?: string | null
}

interface WebhookEndpointRow {
  id: string
}

/**
 * Persist webhook_deliveries rows for every enabled endpoint subscribed to the
 * event in scope. Returns the number of deliveries enqueued.
 */
export async function dispatchWebhook(input: DispatchInput): Promise<number> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from("webhook_endpoints")
      .select("id")
      .eq("enabled", true)
      .contains("events", [input.event])

    if (input.organizationId) {
      query = query.eq("organization_id", input.organizationId)
    } else if (input.userId) {
      query = query.eq("user_id", input.userId)
    }

    const { data: endpoints, error } = await query
    if (error) {
      log("error", "dispatchWebhook query failed", { event: input.event, err: error.message })
      return 0
    }

    const rows = (endpoints ?? []) as WebhookEndpointRow[]
    if (rows.length === 0) return 0

    const deliveries = rows.map((e) => ({
      endpoint_id: e.id,
      event: input.event,
      payload: input.payload,
      status: "pending",
    }))

    const { error: insertErr } = await supabase.from("webhook_deliveries").insert(deliveries)
    if (insertErr) {
      log("error", "dispatchWebhook insert failed", { event: input.event, err: insertErr.message })
      return 0
    }

    return rows.length
  } catch (err) {
    log("error", "dispatchWebhook unexpected", {
      event: input.event,
      err: err instanceof Error ? err.message : String(err),
    })
    return 0
  }
}

/** Generate a fresh secret for new webhook endpoints. */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString("hex")}`
}

/** HMAC-SHA256 signature for a delivery body. Used by the worker. */
export function signWebhookBody(body: string, secret: string): string {
  return `t=${Math.floor(Date.now() / 1000)},v1=${createHmac("sha256", secret)
    .update(body)
    .digest("hex")}`
}

/** Worker side: claim and deliver one pending webhook. Returns true if a job was processed. */
export async function processNextWebhookDelivery(): Promise<boolean> {
  const supabase = createServiceClient()

  const { data: claimed, error: claimErr } = await supabase.rpc("webhook_claim_next")
  if (claimErr) {
    log("error", "webhook_claim_next failed", { err: claimErr.message })
    return false
  }
  if (!claimed) return false

  type DeliveryRow = {
    id: string
    endpoint_id: string
    event: string
    payload: Record<string, unknown>
    attempt_count: number
    max_attempts: number
  }
  const delivery: DeliveryRow = Array.isArray(claimed)
    ? (claimed[0] as DeliveryRow)
    : (claimed as DeliveryRow)
  if (!delivery) return false

  const { data: endpoint } = await supabase
    .from("webhook_endpoints")
    .select("url, secret, enabled")
    .eq("id", delivery.endpoint_id)
    .single()

  if (!endpoint || !endpoint.enabled) {
    await supabase
      .from("webhook_deliveries")
      .update({ status: "cancelled", delivered_at: new Date().toISOString() })
      .eq("id", delivery.id)
    return true
  }

  const body = JSON.stringify({ event: delivery.event, payload: delivery.payload })
  const signature = signWebhookBody(body, endpoint.secret)

  try {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MedCongress-Event": delivery.event,
        "X-MedCongress-Signature": signature,
        "User-Agent": "MedCongress-Webhooks/1.0",
      },
      body,
    })

    const responseBody = await response.text().catch(() => "")
    const ok = response.status >= 200 && response.status < 300

    await supabase
      .from("webhook_deliveries")
      .update({
        status: ok ? "delivered" : delivery.attempt_count >= delivery.max_attempts ? "failed" : "pending",
        response_status: response.status,
        response_body: responseBody.slice(0, 2000),
        delivered_at: ok ? new Date().toISOString() : null,
        scheduled_at: ok
          ? null
          : new Date(Date.now() + Math.min(60_000 * 2 ** delivery.attempt_count, 3_600_000)).toISOString(),
      })
      .eq("id", delivery.id)

    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed"
    await supabase
      .from("webhook_deliveries")
      .update({
        status: delivery.attempt_count >= delivery.max_attempts ? "failed" : "pending",
        response_body: message.slice(0, 2000),
        scheduled_at: new Date(Date.now() + 60_000 * 2 ** delivery.attempt_count).toISOString(),
      })
      .eq("id", delivery.id)

    return true
  }
}
