import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import UpgradeButton from "@/components/billing/upgrade-button"

export const dynamic = "force-dynamic"

export async function generateMetadata() {
  const t = await getTranslations("pricing")
  return { title: `${t("title")} · MDCONGRESS` }
}

export default async function PlanesPage() {
  const t = await getTranslations("pricing")
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let plan = "free"
  if (user) {
    const { data } = await supabase
      .from("ai_usage_limits")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle()
    plan = data?.plan ?? "free"
  }
  const isPro = plan === "pro"

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href={user ? "/dashboard" : "/"}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("back")}
        </Link>

        <header className="mt-4 mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
          <p className="mt-2 text-slate-500">{t("subtitle")}</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t("free")}</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900">{t("freePrice")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("freeFor")}</p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
              {[t("freeF1"), t("freeF2"), t("freeF3"), t("freeF4")].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  {f}
                </li>
              ))}
            </ul>
            {!user && (
              <Link
                href="/registro"
                className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t("startFree")}
              </Link>
            )}
            {user && !isPro && (
              <p className="mt-6 text-center text-xs font-semibold text-slate-400">{t("current")}</p>
            )}
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border-2 border-teal-600 bg-white p-6 shadow-lg shadow-teal-100">
            <span className="absolute -top-3 left-6 rounded-full bg-teal-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {t("mostPopular")}
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wide text-teal-700">{t("pro")}</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {t("proPrice")}
              <span className="text-base font-medium text-slate-400">{t("monthly")}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">{t("proFor")}</p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
              {[t("proF1"), t("proF2"), t("proF3"), t("proF4")].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {!user ? (
                <Link
                  href="/registro"
                  className="inline-flex w-full items-center justify-center rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
                >
                  {t("startFree")}
                </Link>
              ) : isPro ? (
                <p className="text-center text-xs font-semibold text-teal-700">{t("current")}</p>
              ) : (
                <UpgradeButton />
              )}
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-400">{t("taxNote")}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
