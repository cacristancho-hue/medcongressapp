"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { createProCheckout } from "@/lib/billing/lemonsqueezy"

// Creates a Lemon Squeezy checkout for the current user and returns its URL.
// The client redirects the browser there. On success LS redirects back to
// /dashboard/ajustes?upgraded=1 and the webhook flips the plan to 'pro'.
export async function startProCheckout(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: "No autorizado" }

  const hdrs = await headers()
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (hdrs.get("origin") || `https://${hdrs.get("host") ?? "app-omega-hazel-21.vercel.app"}`)

  try {
    const url = await createProCheckout({
      userId: user.id,
      email: user.email,
      redirectUrl: `${origin}/dashboard/ajustes?upgraded=1`,
    })
    return { url }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo iniciar el pago." }
  }
}
