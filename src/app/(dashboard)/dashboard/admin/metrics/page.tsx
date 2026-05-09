// Admin metrics page. Visible only to users in an organization with plan='admin'.
// Server component; pulls aggregates straight from the DB with the user's
// session (RLS-aware), so leaking is impossible even if the route is reachable.

import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  Users,
  ImageIcon,
  Sparkles,
  AlertTriangle,
  ListChecks,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface AiUsageRow {
  estimated_cost_usd: number | string | null
  status: string
  model: string | null
}

interface JobRow {
  status: string
  job_type: string
}

export default async function AdminMetricsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Gate: must belong to an admin-plan organization.
  const { data: adminMembership } = await supabase
    .from("organization_memberships")
    .select(
      `organization_id, role, organizations!inner(plan)`
    )
    .eq("user_id", user.id)
    .eq("role", "owner")
    .limit(50)

  type Row = { organizations: { plan: string } | { plan: string }[] | null }
  const isAdmin = ((adminMembership ?? []) as unknown as Row[]).some((m) => {
    const orgs = m.organizations
    if (!orgs) return false
    if (Array.isArray(orgs)) return orgs.some((o) => o.plan === "admin")
    return orgs.plan === "admin"
  })
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-900">Acceso restringido</h1>
        <p className="text-sm text-slate-500 mt-2 mx-auto max-w-md">
          Esta vista es solo para administradores. Si crees que deberías tener
          acceso, contacta al equipo.
        </p>
        <Link href="/dashboard" className="text-sm text-slate-600 hover:underline mt-4 inline-block">
          Volver al dashboard
        </Link>
      </div>
    )
  }

  const sinceMonth = new Date()
  sinceMonth.setUTCDate(1)
  sinceMonth.setUTCHours(0, 0, 0, 0)

  // Pull aggregates in parallel.
  const [
    { count: totalUsers },
    { count: totalOrgs },
    { count: totalCongresses },
    { count: totalImages },
    aiUsageRes,
    jobsRes,
    recentErrorsRes,
  ] = await Promise.all([
    supabase.from("auth.users").select("id", { count: "exact", head: true }),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("congresses").select("id", { count: "exact", head: true }),
    supabase.from("congress_images").select("id", { count: "exact", head: true }),
    supabase
      .from("ai_usage")
      .select("estimated_cost_usd, status, model")
      .gte("created_at", sinceMonth.toISOString()),
    supabase.from("ai_jobs").select("status, job_type"),
    supabase
      .from("audit_log")
      .select("action, status, created_at, metadata")
      .eq("status", "error")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const aiRows = (aiUsageRes.data ?? []) as AiUsageRow[]
  const totalCostUsd = aiRows.reduce(
    (sum, r) => sum + Number(r.estimated_cost_usd ?? 0),
    0
  )
  const successCount = aiRows.filter((r) => r.status === "success").length
  const blockedCount = aiRows.filter((r) => r.status === "blocked").length
  const errorCount = aiRows.filter((r) => r.status === "error").length

  const jobs = (jobsRes.data ?? []) as JobRow[]
  const jobsPending = jobs.filter((j) => j.status === "pending").length
  const jobsProcessing = jobs.filter((j) => j.status === "processing").length
  const jobsFailed = jobs.filter((j) => j.status === "failed").length

  const recentErrors = recentErrorsRes.data ?? []

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">Operaciones</p>
        <h1 className="text-2xl font-bold text-slate-900">Métricas de la plataforma</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visión consolidada del uso, costos IA y estado de la cola.
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <MetricCard icon={Users} label="Usuarios" value={totalUsers ?? "—"} />
        <MetricCard icon={Activity} label="Organizaciones" value={totalOrgs ?? 0} />
        <MetricCard icon={ListChecks} label="Congresos" value={totalCongresses ?? 0} />
        <MetricCard icon={ImageIcon} label="Fotos" value={totalImages ?? 0} />
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          IA — mes en curso
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            icon={Sparkles}
            label="Llamadas exitosas"
            value={successCount}
            tone="text-emerald-600"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Bloqueadas (cuota)"
            value={blockedCount}
            tone="text-amber-600"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Errores"
            value={errorCount}
            tone="text-red-600"
          />
          <MetricCard
            icon={Sparkles}
            label="Costo total USD"
            value={`$${totalCostUsd.toFixed(2)}`}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Cola de jobs
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard icon={Clock} label="Pendientes" value={jobsPending} tone="text-slate-600" />
          <MetricCard icon={Activity} label="En curso" value={jobsProcessing} tone="text-blue-600" />
          <MetricCard icon={AlertTriangle} label="Fallidos" value={jobsFailed} tone="text-red-600" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Últimos 10 errores
        </h2>
        {recentErrors.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-slate-500">
              Sin errores recientes.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-0 px-0">
              <ul className="divide-y divide-slate-100">
                {recentErrors.map((row, idx) => (
                  <li key={idx} className="px-4 py-2 text-xs flex justify-between items-baseline">
                    <span className="font-mono text-slate-700">{row.action}</span>
                    <span className="text-slate-400">
                      {new Date(row.created_at).toLocaleString("es-CO")}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "text-slate-900",
}: {
  icon: typeof Activity
  label: string
  value: number | string
  tone?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-3">
        <CardTitle className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Icon className="h-3 w-3" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
