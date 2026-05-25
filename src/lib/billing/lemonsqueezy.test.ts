import { describe, it, expect, beforeAll } from "vitest"
import { createHmac } from "node:crypto"
import { isProStatus, parseWebhookEvent, verifyWebhookSignature } from "./lemonsqueezy"

describe("isProStatus", () => {
  it("concede Pro en estados activos (incl. cancelled dentro de periodo)", () => {
    for (const s of ["active", "on_trial", "cancelled", "paused"]) {
      expect(isProStatus(s)).toBe(true)
    }
  })
  it("niega Pro en estados terminados/inválidos", () => {
    for (const s of ["expired", "unpaid", "past_due", null, undefined, ""]) {
      expect(isProStatus(s as string | null | undefined)).toBe(false)
    }
  })
})

describe("parseWebhookEvent", () => {
  it("mapea el payload de suscripción de LS", () => {
    const payload = {
      meta: { event_name: "subscription_created", custom_data: { user_id: "user-123" } },
      data: {
        id: "sub-999",
        attributes: {
          customer_id: 555,
          variant_id: 42,
          status: "active",
          renews_at: "2026-07-01T00:00:00Z",
          ends_at: null,
        },
      },
    }
    expect(parseWebhookEvent(payload)).toEqual({
      eventName: "subscription_created",
      userId: "user-123",
      customerId: "555",
      subscriptionId: "sub-999",
      variantId: "42",
      status: "active",
      renewsAt: "2026-07-01T00:00:00Z",
      endsAt: null,
    })
  })

  it("devuelve null si falta meta/data", () => {
    expect(parseWebhookEvent({})).toBeNull()
    expect(parseWebhookEvent({ meta: { event_name: "x" } })).toBeNull()
  })
})

describe("verifyWebhookSignature", () => {
  const SECRET = "test-signing-secret"
  const body = JSON.stringify({ meta: { event_name: "subscription_updated" } })

  beforeAll(() => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET
  })

  it("acepta una firma HMAC-SHA256 válida", () => {
    const sig = createHmac("sha256", SECRET).update(body).digest("hex")
    expect(verifyWebhookSignature(body, sig)).toBe(true)
  })

  it("rechaza firma inválida, vacía o de otro secreto", () => {
    const wrong = createHmac("sha256", "otro").update(body).digest("hex")
    expect(verifyWebhookSignature(body, wrong)).toBe(false)
    expect(verifyWebhookSignature(body, null)).toBe(false)
    expect(verifyWebhookSignature(body, "deadbeef")).toBe(false)
  })
})
