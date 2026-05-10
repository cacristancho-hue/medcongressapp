import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Webhook } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "../_admin-gate"
import WebhooksTable from "@/components/admin/webhooks-table"

export const dynamic = "force-dynamic"

export default async function AdminWebhooksPage() {
  const user = await requireAdmin()
  if (!user) redirect("/dashboard")

  const supabase = await createClient()
  const { data: endpoints } = await supabase
    .from("webhook_endpoints")
    .select("id, url, description, events, enabled, created_at")
    .order("created_at", { ascending: false })

  const { data: deliveries } = await supabase
    .from("webhook_deliveries")
    .select("id, endpoint_id, event, status, response_status, attempt_count, created_at")
    .order("created_at", { ascending: false })
    .limit(20)

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
          <Webhook className="h-5 w-5" />
          Webhooks
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Endpoints HTTPS que reciben events firmados con HMAC-SHA256.
        </p>
      </header>

      <WebhooksTable endpoints={endpoints ?? []} />

      <Card className="mt-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Últimas 20 entregas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {(!deliveries || deliveries.length === 0) ? (
            <p className="text-xs text-slate-500">Sin entregas registradas.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-xs">
              {deliveries.map((d) => (
                <li key={d.id} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-slate-700">{d.event}</span>
                    <span className="text-slate-400 ml-2">
                      attempt {d.attempt_count} · status {d.response_status ?? "—"}
                    </span>
                  </div>
                  <span
                    className={
                      d.status === "delivered"
                        ? "text-emerald-600"
                        : d.status === "failed"
                          ? "text-red-600"
                          : "text-slate-500"
                    }
                  >
                    {d.status}
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
