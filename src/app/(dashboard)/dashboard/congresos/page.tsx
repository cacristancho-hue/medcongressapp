import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import DeleteCongressButton from "./[id]/delete-congress-button"

export default async function CongresosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: congresses } = await supabase
    .from("congresses")
    .select("*")
    .eq("user_id", user!.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mis congresos</h2>
          <p className="text-slate-500 text-sm mt-1">
            {congresses?.length ?? 0} congreso{congresses?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/congresos/nuevo"
          className="inline-flex items-center justify-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
        >
          + Nuevo congreso
        </Link>
      </div>

      {(!congresses || congresses.length === 0) ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-medium text-slate-900 mb-1">Sin congresos todavía</p>
            <p className="text-slate-500 text-sm mb-5">
              Crea tu primer congreso y empieza a subir tus fotos académicas.
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
            <div key={congress.id} className="group relative">
              <Link href={`/dashboard/congresos/${congress.id}`}>
                <Card className="hover:border-slate-300 transition-colors cursor-pointer">
                  <CardContent className="py-4 pr-12">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{congress.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          {congress.specialty && (
                            <span className="text-xs text-slate-500">{congress.specialty}</span>
                          )}
                          {congress.location && (
                            <span className="text-xs text-slate-500">📍 {congress.location}</span>
                          )}
                          {congress.start_date && (
                            <span className="text-xs text-slate-500">
                              📅 {new Date(congress.start_date).toLocaleDateString("es-CO", {
                                year: "numeric", month: "short", day: "numeric"
                              })}
                            </span>
                          )}
                        </div>
                        {congress.notes && (
                          <p className="text-xs text-slate-400 mt-1.5 truncate">{congress.notes}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(congress.created_at).toLocaleDateString("es-CO", {
                          month: "short", day: "numeric"
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DeleteCongressButton congressId={congress.id} congressName={congress.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
