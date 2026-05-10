"use server"

import { revalidatePath } from "next/cache"
import { withAction } from "@/lib/with-action"
import { generateWebhookSecret } from "@/lib/webhooks"

// =============================================================================
// Feature flags admin
// =============================================================================

interface UpdateFlagInput {
  key: string
  enabled: boolean
  rolloutPercentage: number
}

export const updateFeatureFlag = withAction({
  name: "admin.override",
  rateLimit: "auth_login",
})(async ({ user, supabase }, input: UpdateFlagInput) => {
  await ensureAdmin(supabase, user.id)

  const { error } = await supabase
    .from("feature_flags")
    .update({
      enabled: input.enabled,
      rollout_percentage: Math.max(0, Math.min(100, input.rolloutPercentage)),
    })
    .eq("key", input.key)

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/admin/flags")
  return {}
})

// =============================================================================
// Webhooks admin
// =============================================================================

interface CreateWebhookInput {
  url: string
  description?: string
  events: string[]
}

export const createWebhookEndpoint = withAction({
  name: "admin.override",
  rateLimit: "auth_login",
})(async ({ user, supabase }, input: CreateWebhookInput) => {
  if (!input.url || !input.url.startsWith("https://")) {
    throw new Error("La URL debe ser HTTPS.")
  }
  if (!input.events || input.events.length === 0) {
    throw new Error("Selecciona al menos un evento.")
  }

  // Use the user's primary org if any, else null.
  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle()

  const secret = generateWebhookSecret()

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .insert({
      user_id: user.id,
      organization_id: membership?.organization_id ?? null,
      url: input.url,
      description: input.description ?? null,
      events: input.events,
      secret,
      enabled: true,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/admin/webhooks")
  return { id: data.id, secret }
})

interface ToggleWebhookInput {
  id: string
  enabled: boolean
}

export const toggleWebhookEndpoint = withAction({
  name: "admin.override",
  rateLimit: "auth_login",
})(async ({ user, supabase }, input: ToggleWebhookInput) => {
  const { error } = await supabase
    .from("webhook_endpoints")
    .update({ enabled: input.enabled })
    .eq("id", input.id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/admin/webhooks")
  return {}
})

export const deleteWebhookEndpoint = withAction({
  name: "admin.override",
  rateLimit: "auth_login",
})(async ({ user, supabase }, id: string) => {
  const { error } = await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/admin/webhooks")
  return {}
})

// =============================================================================
// Helpers
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

async function ensureAdmin(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data } = await supabase
    .from("organization_memberships")
    .select("role, organizations!inner(plan)")
    .eq("user_id", userId)
    .eq("role", "owner")

  type Row = { organizations: { plan: string } | { plan: string }[] | null }
  const isAdmin = ((data ?? []) as unknown as Row[]).some((m) => {
    const orgs = m.organizations
    if (!orgs) return false
    if (Array.isArray(orgs)) return orgs.some((o) => o.plan === "admin")
    return orgs.plan === "admin"
  })

  if (!isAdmin) throw new Error("Acceso restringido")
}
