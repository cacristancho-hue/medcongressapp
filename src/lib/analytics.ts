"use server"

// Server-side analytics emitter. Server components and server actions can
// call trackEvent() to record a product event into public.analytics_events.
//
// Difference vs audit_log:
//   - audit_log = compliance-focused (auth, sensitive actions, errors)
//   - analytics = product-focused (page views, feature usage, funnel steps)
// Both are append-only.

import { createClient } from "@/lib/supabase/server"

export type AnalyticsEvent =
  | "page.view"
  | "auth.signup_started"
  | "auth.signup_completed"
  | "congress.created"
  | "congress.opened"
  | "image.upload_started"
  | "image.upload_completed"
  | "ai.assistant_started"
  | "ai.report_generated"
  | "library.searched"
  | "admin.viewed"

export interface TrackEventInput {
  name: AnalyticsEvent
  props?: Record<string, unknown>
  urlPath?: string
  sessionId?: string
}

/**
 * Persist a product event. Never throws; emits a structured warn on failure
 * so analytics can never break a user-facing action.
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Resolve current organization (first owner membership).
    let orgId: string | null = null
    if (user) {
      const { data: m } = await supabase
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
      orgId = m?.organization_id ?? null
    }

    await supabase.from("analytics_events").insert({
      user_id: user?.id ?? null,
      organization_id: orgId,
      event_name: input.name,
      props: input.props ?? {},
      session_id: input.sessionId ?? null,
      url_path: input.urlPath ?? null,
    })
  } catch (err) {
    console.warn("[analytics] failed:", err instanceof Error ? err.message : String(err))
  }
}
