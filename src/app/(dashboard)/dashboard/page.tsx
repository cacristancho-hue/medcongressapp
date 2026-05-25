import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  ImageIcon,
  ClipboardList,
  FileText,
  Plus,
  Stethoscope,
  BookCheck,
  Activity,
} from "lucide-react"
import GlobalSearch from "@/components/congresses/global-search"
import DashboardTour from "@/components/onboarding/dashboard-tour"
import { getTranslations, getLocale } from "next-intl/server"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: congresses, count: congressCount },
    { count: photoCount },
    { count: reportCount },
    { count: refsVerified },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
    supabase
      .from("congresses")
      .select("id, name, specialty, location, start_date, created_at", { count: "exact" })
      .eq("user_id", user!.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("congress_images")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .is("deleted_at", null),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .is("deleted_at", null),
    supabase
      .from("reference_candidates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("verification_status", "verified"),
  ])

  const t = await getTranslations("home")
  const firstName = profile?.full_name?.split(" ")[0] ?? t("defaultName")
  const specialty = profile?.specialty
  const role = profile?.role
  const greeting = t(greetingKeyForHour())
  const isFirstTime = (congressCount ?? 0) === 0

  return (
    <div className="max-w-5xl">
      <header className="mb-8 flex justify-between items-start gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-teal-700 font-medium mb-1">
            {greeting}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {t("hello")}, <span className="font-plex-mono">{firstName}</span>.
          </h1>
          {specialty && (
            <p className="text-teal-700 font-medium text-sm mt-1">
              {specialty} {role ? `· ${role}` : ""}
            </p>
          )}
          <p className="text-slate-600 mt-2 text-base max-w-xl">
            {t("subtitle")}
          </p>
        </div>

        <Link
          href="/dashboard/tutorial"
          className="text-[10px] font-bold text-slate-400 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="h-3 w-3" />
          {t("howItWorks")}
        </Link>
      </header>

      {!isFirstTime && (
        <div className="mb-8">
          <GlobalSearch />
        </div>
      )}

      {isFirstTime ? (
        <FirstTimeWelcome />
      ) : (
        <>
          <div data-tour="dashboard-stats">
            <StatsRow
              congresses={congressCount ?? 0}
              photos={photoCount ?? 0}
              reports={reportCount ?? 0}
              verified={refsVerified ?? 0}
            />
          </div>

          <div data-tour="dashboard-recent">
            <RecentCongresses congresses={congresses ?? []} />
          </div>

          <DashboardTour />
        </>
      )}
    </div>
  )
}

async function FirstTimeWelcome() {
  const t = await getTranslations("home")
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-blue-800 px-6 sm:px-10 py-10 sm:py-14 text-white shadow-xl shadow-teal-900/10">
        <svg
          className="absolute right-0 top-0 h-full w-1/2 opacity-15 pointer-events-none"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M0 200 H80 L120 80 L160 320 L200 100 L240 280 L280 200 H400"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur">
            <Sparkles className="h-3 w-3" />
            {t("welcomeBadge")}
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold leading-tight">
            {t("welcomeTitle")}
          </h2>
          <p className="mt-3 text-teal-50/90 text-base leading-relaxed">
            {t("welcomeDesc")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/congresos/nuevo"
              className="inline-flex items-center gap-2 rounded-lg bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              {t("createFirst")}
            </Link>
            <Link
              href="/legal/terminos"
              className="inline-flex items-center gap-1 rounded-lg border border-white/30 px-5 py-2.5 text-sm font-medium hover:bg-white/10 transition-all"
            >
              {t("howItWorksLink")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Step
          number="01"
          title={t("step1Title")}
          description={t("step1Desc")}
          icon={ClipboardList}
        />
        <Step
          number="02"
          title={t("step2Title")}
          description={t("step2Desc")}
          icon={ImageIcon}
        />
        <Step
          number="03"
          title={t("step3Title")}
          description={t("step3Desc")}
          icon={Sparkles}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BookCheck className="h-4 w-4 text-teal-600" />
          {t("qualityTitle")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Bullet>{t("quality1")}</Bullet>
          <Bullet>{t("quality2")}</Bullet>
          <Bullet>{t("quality3")}</Bullet>
          <Bullet>{t("quality4")}</Bullet>
        </div>
      </div>
    </div>
  )
}

function Step({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string
  title: string
  description: string
  icon: typeof ClipboardList
}) {
  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-300 hover:shadow-md transition-all">
      <span className="absolute top-4 right-4 font-mono text-xs text-slate-300 tracking-wider">
        {number}
      </span>
      <div className="inline-flex items-center justify-center rounded-lg bg-teal-50 text-teal-700 w-9 h-9 mb-3">
        <Icon className="h-4 w-4" />
      </div>
      <h4 className="font-semibold text-slate-900 text-sm">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-slate-600">
      <span className="mt-1.5 inline-block w-1 h-1 rounded-full bg-teal-600 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

interface StatsRowProps {
  congresses: number
  photos: number
  reports: number
  verified: number
}

async function StatsRow({ congresses, photos, reports, verified }: StatsRowProps) {
  const t = await getTranslations("home")
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      <Stat icon={ClipboardList} label={t("statCongresses")} value={congresses} accent="text-slate-900" />
      <Stat icon={ImageIcon} label={t("statPhotos")} value={photos} accent="text-slate-900" />
      <Stat icon={FileText} label={t("statReports")} value={reports} accent="text-slate-900" />
      <Stat icon={BookCheck} label={t("statVerified")} value={verified} accent="text-emerald-700" />
    </section>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Activity
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-1.5 text-slate-500">
        <Icon className="h-3 w-3" />
        <span className="text-[11px] uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}

interface CongressRow {
  id: string
  name: string
  specialty: string | null
  location: string | null
  start_date: string | null
  created_at: string
}

async function RecentCongresses({ congresses }: { congresses: CongressRow[] }) {
  const t = await getTranslations("home")
  const locale = await getLocale()
  const dateLocale = locale === "en" ? "en-US" : "es-CO"
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          {t("recentTitle")}
        </h3>
        <Link
          href="/dashboard/congresos"
          className="inline-flex items-center gap-1 text-xs text-teal-700 font-medium hover:text-teal-800"
        >
          {t("seeAll")}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {congresses.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/congresos/${c.id}`}
            className="block rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-teal-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="inline-flex items-center justify-center rounded-lg bg-teal-50 text-teal-700 w-9 h-9 shrink-0 group-hover:bg-teal-100 transition-colors">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate group-hover:text-teal-800 transition-colors">
                    {c.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {[c.specialty, c.location].filter(Boolean).join(" · ") || t("noDetails")}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                {new Date(c.created_at).toLocaleDateString(dateLocale, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </Link>
        ))}
        <Link
          href="/dashboard/congresos/nuevo"
          className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-teal-700 border-2 border-dashed border-slate-200 hover:border-teal-300 rounded-xl py-4 transition-all"
        >
          <Plus className="h-4 w-4" />
          {t("newCongress")}
        </Link>
      </div>
    </section>
  )
}

function greetingKeyForHour(): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  const h = new Date().getHours()
  if (h < 12) return "greetingMorning"
  if (h < 19) return "greetingAfternoon"
  return "greetingEvening"
}
