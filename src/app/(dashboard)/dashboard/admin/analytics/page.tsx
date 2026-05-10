import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "../_admin-gate"

export const dynamic = "force-dynamic"

interface CountRow {
  event_name: string
  total: number
}

export default async function AdminAnalyticsPage() {
  const user = await requireAdmin()
  if (!user) redirect("/dashboard")

  const supabase = await createClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Aggregate by event name (last 7 days). RLS restricts non-admin sees.
  const { data: rawEvents } = await supabase
    .from("analytics_events")
    .select("event_name")
    .gte("created_at", sevenDaysAgo.toISOString())

  const counts = new Map<string, number>()
  for (const row of (rawEvents ?? []) as { event_name: string }[]) {
    counts.set(row.event_name, (counts.get(row.event_name) ?? 0) + 1)
  }

  const ranked: CountRow[] = Array.from(counts.entries())
    .map(([event_name, total]) => ({ event_name, total }))
    .sort((a, b) => b.total - a.total)

  const totalEvents = ranked.reduce((s, r) => s + r.total, 0)

  // Recent events (last 30).
  const { data: recent } = await supabase
    .from("analytics_events")
    .select("event_name, created_at, url_path, props")
    .order("created_at", { ascending: false })
    .limit(30)

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <Link
        href="/dashboard/admin/metrics"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a métricas
      </Link>
      <header className="mt-2 mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">Operaciones</p>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Eventos de producto de los últimos 7 días: {totalEvents.toLocaleString("es-CO")} totales.
        </p>
      </header>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Top eventos (7 días)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {ranked.length === 0 ? (
            <p className="text-xs text-slate-500">Sin eventos registrados.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {ranked.map((row) => {
                const pct = totalEvents > 0 ? (row.total / totalEvents) * 100 : 0
                return (
                  <li key={row.event_name} className="py-2">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-mono text-slate-700">{row.event_name}</span>
                      <span className="text-xs text-slate-500">
                        {row.total.toLocaleString("es-CO")} · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Últimos 30 eventos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {(!recent || recent.length === 0) ? (
            <p className="text-xs text-slate-500">Sin actividad reciente.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-xs">
              {recent.map((row, idx) => (
                <li key={idx} className="py-2 flex justify-between items-baseline">
                  <div>
                    <span className="font-mono text-slate-700">{row.event_name}</span>
                    {row.url_path && (
                      <span className="ml-2 text-slate-400">{row.url_path}</span>
                    )}
                  </div>
                  <span className="text-slate-400">
                    {new Date(row.created_at).toLocaleString("es-CO")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
