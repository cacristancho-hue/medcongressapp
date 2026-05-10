// Generic incoming webhook receiver.
// Pattern: providers POST to /api/webhooks/incoming/<provider>.
// We:
//   1. Read raw body (needed for HMAC verification, signature schemes vary)
//   2. Verify the signature against per-provider secret
//   3. Store the payload in webhook_inbound (signature_valid=true|false)
//   4. Acknowledge with 200 quickly; processing happens async.
//
// Today we only declare a stub provider 'test' for smoke testing. Real ones
// (Stripe, Cvent, Whova, society partners) plug into the verify map below.

import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createHmac, timingSafeEqual } from "node:crypto"
import { log } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface ProviderConfig {
  secretEnv: string
  signatureHeader: string
  // (rawBody, signatureHeader, secret) -> boolean
  verify: (rawBody: string, signature: string | null, secret: string) => boolean
}

// Per-provider configuration. Add a new entry to onboard a partner.
const PROVIDERS: Record<string, ProviderConfig> = {
  test: {
    secretEnv: "WEBHOOK_TEST_SECRET",
    signatureHeader: "x-medcongress-signature",
    verify: verifyHmacSha256,
  },
  // Example for future Stripe integration:
  // stripe: {
  //   secretEnv: "STRIPE_WEBHOOK_SECRET",
  //   signatureHeader: "stripe-signature",
  //   verify: verifyStripeSignature,
  // },
}

function verifyHmacSha256(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  // Accepts our own outgoing format: "t=<ts>,v1=<sig>"
  const v1 = signature
    .split(",")
    .map((p) => p.trim().split("="))
    .find(([k]) => k === "v1")?.[1]
  const sigToCheck = v1 ?? signature
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  try {
    return timingSafeEqual(Buffer.from(sigToCheck, "hex"), Buffer.from(expected, "hex"))
  } catch {
    return false
  }
}

interface RouteContext {
  params: Promise<{ provider: string }>
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { provider } = await ctx.params
  const config = PROVIDERS[provider]
  if (!config) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 })
  }

  const secret = process.env[config.secretEnv]
  if (!secret) {
    log("error", "webhook receiver missing secret", { provider, env: config.secretEnv })
    return NextResponse.json({ error: "Provider not configured" }, { status: 503 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get(config.signatureHeader)
  const valid = config.verify(rawBody, signature, secret)

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    parsed = { raw: rawBody.slice(0, 4096) }
  }

  const eventType =
    (parsed && typeof parsed === "object" && "event" in parsed
      ? String((parsed as { event?: unknown }).event)
      : null) ?? null

  const supabase = createServiceClient()
  const { error } = await supabase.from("webhook_inbound").insert({
    provider,
    event_type: eventType,
    payload: parsed,
    signature: signature ?? null,
    signature_valid: valid,
    source_ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null,
  })

  if (error) {
    log("error", "webhook_inbound insert failed", { provider, err: error.message })
    return NextResponse.json({ error: "Storage failed" }, { status: 500 })
  }

  // 401 if invalid signature (after we've stored it for forensic purposes).
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
