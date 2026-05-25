// Lemon Squeezy billing integration (merchant of record).
// We use the REST API directly (no SDK dependency): one call to create a hosted
// checkout, plus HMAC verification for the webhook. The webhook updates the
// user's plan/quotas in ai_usage_limits.
//
// Required env vars (set in Vercel + .env.local):
//   LEMONSQUEEZY_API_KEY        – API key (Settings → API)
//   LEMONSQUEEZY_STORE_ID       – numeric store id
//   LEMONSQUEEZY_VARIANT_ID_PRO – variant id of the Pro subscription product
//   LEMONSQUEEZY_WEBHOOK_SECRET – signing secret configured on the webhook

import { createHmac, timingSafeEqual } from "node:crypto"

const LS_API = "https://api.lemonsqueezy.com/v1"

// LS subscription statuses that grant Pro access. "cancelled" still has access
// until the period ends (LS keeps it active until subscription_ends_at).
const ACTIVE_STATUSES = new Set(["active", "on_trial", "cancelled", "paused"])

export function isProStatus(status: string | null | undefined): boolean {
  return !!status && ACTIVE_STATUSES.has(status)
}

interface CreateCheckoutParams {
  userId: string
  email: string
  redirectUrl: string
}

// Creates a hosted checkout URL for the Pro plan. The user_id is embedded in
// checkout custom data so the webhook can map the subscription back to the user.
export async function createProCheckout(params: CreateCheckoutParams): Promise<string> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID_PRO

  if (!apiKey || !storeId || !variantId) {
    throw new Error("Facturación no configurada (faltan variables LEMONSQUEEZY_*).")
  }

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: params.email,
          custom: { user_id: params.userId },
        },
        product_options: {
          redirect_url: params.redirectUrl,
        },
      },
      relationships: {
        store: { data: { type: "stores", id: String(storeId) } },
        variant: { data: { type: "variants", id: String(variantId) } },
      },
    },
  }

  const res = await fetch(`${LS_API}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Lemon Squeezy checkout falló (${res.status}): ${detail.slice(0, 300)}`)
  }

  const json = (await res.json()) as { data?: { attributes?: { url?: string } } }
  const url = json.data?.attributes?.url
  if (!url) throw new Error("Lemon Squeezy no devolvió URL de checkout.")
  return url
}

// Verifies the X-Signature header (HMAC-SHA256 hex of the raw body).
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  try {
    const a = Buffer.from(expected, "hex")
    const b = Buffer.from(signature, "hex")
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// Minimal shape of the LS subscription webhook payload we rely on.
export interface LsWebhookEvent {
  eventName: string
  userId: string | null
  customerId: string | null
  subscriptionId: string | null
  variantId: string | null
  status: string | null
  renewsAt: string | null
  endsAt: string | null
}

export function parseWebhookEvent(payload: unknown): LsWebhookEvent | null {
  const p = payload as {
    meta?: { event_name?: string; custom_data?: { user_id?: string } }
    data?: { id?: string; attributes?: Record<string, unknown> }
  }
  if (!p?.meta?.event_name || !p.data) return null
  const attrs = p.data.attributes ?? {}
  return {
    eventName: p.meta.event_name,
    userId: p.meta.custom_data?.user_id ?? null,
    customerId: attrs.customer_id != null ? String(attrs.customer_id) : null,
    subscriptionId: p.data.id ?? null,
    variantId: attrs.variant_id != null ? String(attrs.variant_id) : null,
    status: (attrs.status as string) ?? null,
    renewsAt: (attrs.renews_at as string) ?? null,
    endsAt: (attrs.ends_at as string) ?? null,
  }
}
