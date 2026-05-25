import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import LogoutButton from "@/components/layout/logout-button"
import AccountSettingsPanel from "@/components/dashboard/account-settings-panel"
import UpgradeButton from "@/components/billing/upgrade-button"
import { getTranslations } from "next-intl/server"

export default async function AjustesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations("settings")
  const tb = await getTranslations("billing")

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

  const isPro = aiLimits?.plan === "pro"

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t("pageTitle")}</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">{t("pageSubtitle")}</p>
      </div>

      <div className="mb-4 flex justify-end">
        <LogoutButton className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50" />
      </div>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{tb("title")}</h3>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {isPro ? tb("currentPro") : tb("currentFree")}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {isPro ? tb("proPitch") : tb("freePitch")}
            </p>
          </div>
          {!isPro && (
            <div className="flex flex-col items-end gap-1.5">
              <UpgradeButton />
              <a href="/planes" className="text-xs text-slate-500 hover:text-teal-700 underline underline-offset-2">
                {tb("seePlans")}
              </a>
            </div>
          )}
        </div>
        {isPro && (
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            {tb("manageNote")}
          </p>
        )}
      </section>

      <AccountSettingsPanel
        profile={profile}
        currentEmail={user.email ?? ""}
        aiLimits={aiLimits ?? null}
      />
    </div>
  )
}
