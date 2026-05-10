// Server-side gate for /admin/* pages.
// Returns the user if they belong to an admin-plan org as owner, else returns null.

import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

export async function requireAdmin(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("organization_memberships")
    .select("role, organizations!inner(plan)")
    .eq("user_id", user.id)
    .eq("role", "owner")

  type Row = { organizations: { plan: string } | { plan: string }[] | null }
  const isAdmin = ((data ?? []) as unknown as Row[]).some((m) => {
    const orgs = m.organizations
    if (!orgs) return false
    if (Array.isArray(orgs)) return orgs.some((o) => o.plan === "admin")
    return orgs.plan === "admin"
  })

  return isAdmin ? user : null
}
