"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { log } from "@/lib/logger"

// Stores a user-submitted problem report and, if FEEDBACK_WEBHOOK_URL is set,
// pings it (Discord/Slack-compatible) so we get notified during the build phase.
export async function submitFeedback(input: {
  message: string
  email?: string
  page?: string
}): Promise<{ ok: boolean; error?: string }> {
  const message = input.message?.trim()
  if (!message || message.length < 3) return { ok: false, error: "empty" }
  if (message.length > 4000) return { ok: false, error: "too_long" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const hdrs = await headers()
  const userAgent = hdrs.get("user-agent")?.slice(0, 500) ?? null

  // Service client: insert works for anon and logged-in alike, RLS-safe.
  const service = createServiceClient()
  const { error } = await service.from("feedback_reports").insert({
    user_id: user?.id ?? null,
    email: input.email?.trim()?.slice(0, 320) || user?.email || null,
    message,
    page: input.page?.slice(0, 500) ?? null,
    user_agent: userAgent,
  })

  if (error) {
    log("error", "[feedback] insert falló", { error: error.message })
    return { ok: false, error: "db" }
  }

  // Best-effort notification (never blocks the user response).
  const webhook = process.env.FEEDBACK_WEBHOOK_URL
  if (webhook) {
    const text = `🐞 *Reporte MDCONGRESS*\n${message}\n— ${input.email || user?.email || "anónimo"} · ${input.page ?? ""}`
    void fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, text }), // content=Discord, text=Slack
    }).catch((e) => log("warn", "[feedback] webhook falló", { error: String(e) }))
  }

  return { ok: true }
}
