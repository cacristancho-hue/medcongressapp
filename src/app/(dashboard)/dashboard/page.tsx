import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import GlobalSearch from "@/components/congresses/global-search"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: congresses, count }, { count: photoCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
    supabase
      .from("congresses")
      .select("*", { count: "exact" })
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("congress_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id),
  ])

  const firstName = profile?.full_name?.split(" ")[0] ?? "Dr."

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Bienvenido, {firstName}</h2>
        <p className="text-slate-500 mt-1">
          Convierte tus fotos de congreso en conocimiento académico organizado.
        </p>
      </div>

      <GlobalSearch />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Congresos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Fotos subidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{photoCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Reportes generados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">0</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Congresos recientes</h3>
        <Link
          href="/dashboard/congresos"
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          Ver todos →
        </Link>
      </div>

      {(!congresses || congresses.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 text-sm mb-4">
              No tienes congresos todavía. Crea uno para empezar.
            </p>
            <Link
              href="/dashboard/congresos/nuevo"
              className="inline-flex items-center justify-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
            >
              Crear congreso
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {congresses.map((congress) => (
            <Link key={congress.id} href={`/dashboard/congresos/${congress.id}`}>
              <Card className="hover:border-slate-300 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{congress.name}</p>
                    <p className="text-sm text-slate-500">
                      {congress.specialty ?? "Sin especialidad"} · {congress.location ?? "Sin ubicación"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(congress.created_at).toLocaleDateString("es-CO", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
          <Link
            href="/dashboard/congresos/nuevo"
            className="block text-center py-3 text-sm text-slate-500 hover:text-slate-800 border border-dashed border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
          >
            + Nuevo congreso
          </Link>
        </div>
      )}
    </div>
  )
}
