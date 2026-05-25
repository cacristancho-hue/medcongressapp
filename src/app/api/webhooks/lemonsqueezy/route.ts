// Lemon Squeezy subscription webhook.
// LS POSTs subscription_* events here. We verify the HMAC signature, map the
// subscription back to a user (via custom_data.user_id), and update their
// plan/quotas in ai_usage_limits. Uses the service client (no user session).
//
// Configure in LS dashboard: webhook URL = https://<app>/api/webhooks/lemonsqueezy,
// secret = LEMONSQUEEZY_WEBHOOK_SECRET, events = subscription_*.

import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getPlanDefaults } from "@/lib/plan-limits"
import { log } from "@/lib/logger"
import {
  verifyWebhookSignature,
  parseWebhookEvent,
  isProStatus,
} from "@/lib/billing/lemonsqueezy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-signature")

  if (!verifyWebhookSignature(rawBody, signature)) {
    log("warn", "[ls-webhook] firma inválida")
    return NextResponse.json({ error: "invalid signature" }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const event = parseWebhookEvent(payload)
  if (!event) return NextResponse.json({ error: "unparseable" }, { status: 400 })

  // Only subscription lifecycle events matter for plan state.
  if (!event.eventName.startsWith("subscription_")) {
    return NextResponse.json({ ok: true, ignored: event.eventName })
  }

  if (!event.userId) {
    log("warn", "[ls-webhook] sin user_id en custom_data", { event: event.eventName })
    return NextResponse.json({ ok: true, warning: "no user_id" })
  }

  const pro = isProStatus(event.status)
  const plan = pro ? "pro" : "free"
  const limits = getPlanDefaults(plan)

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("ai_usage_limits")
    .update({
      plan,
      monthly_image_quota: limits.imageQuota,
      monthly_report_quota: limits.reportQuota,
      monthly_cost_cap_usd: limits.monthlyCostCapUsd,
      ls_customer_id: event.customerId,
      ls_subscription_id: event.subscriptionId,
      ls_variant_id: event.variantId,
      subscription_status: event.status,
      subscription_renews_at: event.renewsAt,
      subscription_ends_at: event.endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", event.userId)

  if (error) {
    log("error", "[ls-webhook] fallo al actualizar plan", { error: error.message, userId: event.userId })
    return NextResponse.json({ error: "db update failed" }, { status: 500 })
  }

  log("info", "[ls-webhook] plan actualizado", {
    event: event.eventName,
    userId: event.userId,
    plan,
    status: event.status,
  })
  return NextResponse.json({ ok: true })
}
