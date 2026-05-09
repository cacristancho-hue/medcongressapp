// Service-role Supabase client. ONLY for server-only contexts that legitimately
// bypass RLS: cron worker, admin scripts, webhook handlers.
// NEVER import this from a server action or page.

import { createClient } from "@supabase/supabase-js"

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      "createServiceClient requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY."
    )
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
