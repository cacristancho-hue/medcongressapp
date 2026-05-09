import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Download } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

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

  return (
    <div className="max-w-3xl">
      <Link href={`/dashboard/congresos/${id}`} className="text-sm text-slate-500 hover:text-slate-800">
        Volver al congreso
      </Link>
      <Card className="mt-4">
        <CardContent className="py-12 text-center">
          <Download className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Exportacion proximamente</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Aqui se generaran PDF, Word y paquetes academicos para {congress.name} cuando el flujo este habilitado.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
