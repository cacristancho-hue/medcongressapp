import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, CheckCircle2, XCircle, Ban } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "../_admin-gate"

export const dynamic = "force-dynamic"

interface SearchParams {
  status?: string
  action?: string
  page?: string
}

const PAGE_SIZE = 50

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const user = await requireAdmin()
  if (!user) redirect("/dashboard")

  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const offset = (page - 1) * PAGE_SIZE
  const statusFilter = params.status
  const actionFilter = params.action

  const supabase = await createClient()
  let query = supabase
    .from("audit_log")
    .select("id, action, status, created_at, user_id, organization_id, metadata", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter)
  }
  if (actionFilter) {
    query = query.eq("action", actionFilter)
  }

  const { data: rows, count } = await query

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
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
          <ShieldCheck className="h-5 w-5" />
          Audit log
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {(count ?? 0).toLocaleString("es-CO")} eventos · {PAGE_SIZE} por página
        </p>
      </header>

      <FilterBar status={statusFilter} action={actionFilter} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Página {page} de {totalPages}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-0">
          {(!rows || rows.length === 0) ? (
            <p className="text-xs text-slate-500 px-4 py-8 text-center">
              Sin eventos que coincidan con los filtros.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((row) => (
                <AuditRow key={row.id} row={row} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} status={statusFilter} action={actionFilter} />
    </div>
  )
}

function FilterBar({ status, action }: { status?: string; action?: string }) {
  return (
    <form method="get" className="flex flex-wrap gap-2 mb-4 text-xs">
      <select
        name="status"
        defaultValue={status ?? "all"}
        className="rounded border border-slate-200 px-2 py-1"
      >
        <option value="all">Cualquier estado</option>
        <option value="success">success</option>
        <option value="denied">denied</option>
        <option value="error">error</option>
      </select>
      <input
        name="action"
        defaultValue={action ?? ""}
        placeholder="Filtrar por action (ej. ai.image_analysis)"
        className="flex-1 rounded border border-slate-200 px-2 py-1 font-mono"
      />
      <button className="rounded bg-slate-900 text-white px-3 py-1 hover:bg-slate-800">
        Aplicar
      </button>
    </form>
  )
}

interface Row {
  id: string
  action: string
  status: string
  created_at: string
  user_id: string | null
  organization_id: string | null
  metadata: Record<string, unknown> | null
}

function AuditRow({ row }: { row: Row }) {
  const Icon =
    row.status === "success" ? CheckCircle2 : row.status === "denied" ? Ban : XCircle
  const tone =
    row.status === "success"
      ? "text-emerald-600"
      : row.status === "denied"
        ? "text-amber-600"
        : "text-red-600"

  const meta = row.metadata ?? {}
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : ""

  return (
    <li className="px-4 py-2 flex items-start gap-2 text-xs">
      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${tone}`} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono font-medium text-slate-800">{row.action}</span>
          {row.user_id && (
            <span className="text-[10px] text-slate-400 font-mono">
              user:{row.user_id.slice(0, 8)}
            </span>
          )}
          <span className="ml-auto text-[10px] text-slate-400">
            {new Date(row.created_at).toLocaleString("es-CO")}
          </span>
        </div>
        {metaStr && (
          <p className="text-[10px] text-slate-500 mt-0.5 font-mono break-all">
            {metaStr.length > 200 ? `${metaStr.slice(0, 200)}…` : metaStr}
          </p>
        )}
      </div>
    </li>
  )
}

function Pagination({
  page,
  totalPages,
  status,
  action,
}: {
  page: number
  totalPages: number
  status?: string
  action?: string
}) {
  if (totalPages <= 1) return null

  function buildHref(p: number) {
    const params = new URLSearchParams()
    params.set("page", String(p))
    if (status && status !== "all") params.set("status", status)
    if (action) params.set("action", action)
    return `?${params.toString()}`
  }

  return (
    <div className="flex justify-center gap-2 mt-4 text-xs">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`rounded border border-slate-200 px-3 py-1 ${
          page <= 1 ? "text-slate-300 pointer-events-none" : "hover:bg-slate-50"
        }`}
      >
        ←
      </Link>
      <span className="px-3 py-1 text-slate-500">
        {page} / {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`rounded border border-slate-200 px-3 py-1 ${
          page >= totalPages ? "text-slate-300 pointer-events-none" : "hover:bg-slate-50"
        }`}
      >
        →
      </Link>
    </div>
  )
}
