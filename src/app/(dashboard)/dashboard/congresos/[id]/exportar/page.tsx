import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import ExportButton from "@/components/congresses/export-button"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ExportarPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: congress } = await supabase
    .from("congresses")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()
  if (!congress) notFound()

  const [{ count: photos }, { count: refs }, { count: reports }] = await Promise.all([
    supabase
      .from("congress_images")
      .select("id", { count: "exact", head: true })
      .eq("congress_id", id)
      .is("deleted_at", null),
    supabase
      .from("reference_candidates")
      .select("id", { count: "exact", head: true })
      .eq("congress_id", id),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("congress_id", id)
      .is("deleted_at", null),
  ])

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <Link
        href={`/dashboard/congresos/${id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al congreso
      </Link>
      <header className="mt-2 mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">Exportar</p>
        <h1 className="text-2xl font-bold text-slate-900">{congress.name}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Genera un paquete ZIP con fotos, OCR, reporte académico y bibliografía verificada.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="h-4 w-4" />
            Paquete académico (ZIP)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <ul className="text-xs text-slate-700 space-y-1">
            <li>📷 Fotos optimizadas: <strong>{photos ?? 0}</strong></li>
            <li>📚 Referencias bibliográficas: <strong>{refs ?? 0}</strong></li>
            <li>📝 Reportes académicos: <strong>{reports ?? 0}</strong></li>
            <li>🗂 OCR por foto: incluido</li>
            <li>🏷 Tópicos detectados: incluido</li>
            <li>📋 manifest.json + structured layout</li>
          </ul>
          <p className="text-xs text-slate-500">
            La generación toma ~30-90 segundos según el número de fotos. Una vez listo,
            obtendrás un enlace de descarga válido por 1 hora.
          </p>
          <ExportButton congressId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
