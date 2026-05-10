import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Archive } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import TrashItemActions from "@/components/dashboard/trash-item-actions"

export const dynamic = "force-dynamic"

interface ArchivedRow {
  id: string
  name?: string | null
  title?: string | null
  original_filename?: string | null
  deleted_at: string
}

export default async function PapeleraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [congressesRes, imagesRes, reportsRes] = await Promise.all([
    supabase
      .from("congresses")
      .select("id, name, deleted_at")
      .eq("user_id", user.id)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("congress_images")
      .select("id, original_filename, deleted_at")
      .eq("user_id", user.id)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("reports")
      .select("id, title, deleted_at")
      .eq("user_id", user.id)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ])

  const congresses = (congressesRes.data ?? []) as ArchivedRow[]
  const images = (imagesRes.data ?? []) as ArchivedRow[]
  const reports = (reportsRes.data ?? []) as ArchivedRow[]
  const total = congresses.length + images.length + reports.length

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al dashboard
      </Link>
      <header className="mt-2 mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">Mi cuenta</p>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Papelera
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {total === 0
            ? "Tu papelera está vacía."
            : `${total} elemento${total === 1 ? "" : "s"} archivado${total === 1 ? "" : "s"}.`}
        </p>
      </header>

      {congresses.length > 0 && (
        <Section title="Congresos" rows={congresses} table="congresses" labelKey="name" />
      )}
      {reports.length > 0 && (
        <Section title="Reportes" rows={reports} table="reports" labelKey="title" />
      )}
      {images.length > 0 && (
        <Section
          title="Fotos"
          rows={images}
          table="congress_images"
          labelKey="original_filename"
        />
      )}

      {total === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trash2 className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No hay elementos archivados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Section({
  title,
  rows,
  table,
  labelKey,
}: {
  title: string
  rows: ArchivedRow[]
  table: "congresses" | "congress_images" | "reports"
  labelKey: keyof ArchivedRow
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">
          {title} ({rows.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.id} className="py-2 flex justify-between items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">
                  {(row[labelKey] as string | null | undefined) ?? "(sin título)"}
                </p>
                <p className="text-[10px] text-slate-400">
                  Archivado {new Date(row.deleted_at).toLocaleString("es-CO")}
                </p>
              </div>
              <TrashItemActions table={table} id={row.id} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
