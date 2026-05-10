import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Flag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "../_admin-gate"
import FeatureFlagsTable from "@/components/admin/feature-flags-table"

export const dynamic = "force-dynamic"

export default async function AdminFlagsPage() {
  const user = await requireAdmin()
  if (!user) redirect("/dashboard")

  const supabase = await createClient()
  const { data: flags } = await supabase
    .from("feature_flags")
    .select("key, description, enabled, rollout_percentage, updated_at")
    .order("key")

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
          <Flag className="h-5 w-5" />
          Feature flags
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Encender/apagar features y controlar rollouts graduales sin redeploy.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Flags definidos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <FeatureFlagsTable flags={flags ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
