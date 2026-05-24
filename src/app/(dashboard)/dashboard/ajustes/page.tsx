import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import LogoutButton from "@/components/layout/logout-button"
import AccountSettingsPanel from "@/components/dashboard/account-settings-panel"
import { getTranslations } from "next-intl/server"

export default async function AjustesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations("settings")

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  const { data: aiLimits } = await supabase
    .from("ai_usage_limits")
    .select("plan, monthly_image_quota, monthly_report_quota, monthly_cost_cap_usd")
    .eq("user_id", user.id)
    .maybeSingle()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t("pageTitle")}</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">{t("pageSubtitle")}</p>
      </div>

      <div className="mb-4 flex justify-end">
        <LogoutButton className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50" />
      </div>

      <AccountSettingsPanel
        profile={profile}
        currentEmail={user.email ?? ""}
        aiLimits={aiLimits ?? null}
      />
    </div>
  )
}
