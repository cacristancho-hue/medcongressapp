import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PhotoUploadZone from "@/components/congresses/photo-upload-zone"
import PhotoGrid from "@/components/congresses/photo-grid"
import CongressReport from "@/components/congresses/congress-report"
import JobsStatus from "@/components/congresses/jobs-status"
import CongressPresence from "@/components/congresses/congress-presence"

interface Props {
  params: Promise<{ id: string }>
}

export default async function CongresoDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [
    { data: congress },
    { count: photoCount },
    { count: topicCount },
    { count: referenceCount },
    { data: reports }
  ] = await Promise.all([
    supabase
      .from("congresses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("congress_images")
      .select("*", { count: "exact", head: true })
      .eq("congress_id", id),
    supabase
      .from("topics")
      .select("*", { count: "exact", head: true })
      .eq("congress_id", id),
    supabase
      .from("reference_candidates")
      .select("*", { count: "exact", head: true })
      .eq("congress_id", id),
    supabase
      .from("reports")
      .select("*")
      .eq("congress_id", id)
      .order("created_at", { ascending: false }),
  ])

  if (!congress) notFound()

  const currentCount = photoCount ?? 0
  const currentTopicCount = topicCount ?? 0
  const currentReferenceCount = referenceCount ?? 0

  // Presence display name: full_name from profile, fallback to email.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle()
  const displayName = profile?.full_name ?? user.email ?? "Usuario"

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <div className="mb-2">
        <Link
          href="/dashboard/congresos"
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Mis congresos
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-2xl font-bold text-slate-900">{congress.name}</h2>
          <CongressPresence
            congressId={id}
            currentUserId={user.id}
            currentUserName={displayName}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {congress.specialty && (
            <span className="text-sm text-slate-500">{congress.specialty}</span>
          )}
          {congress.location && (
            <span className="text-sm text-slate-500">📍 {congress.location}</span>
          )}
          {congress.start_date && (
            <span className="text-sm text-slate-500" suppressHydrationWarning>
              📅{" "}
              {new Date(congress.start_date).toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {congress.end_date &&
                ` – ${new Date(congress.end_date).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}`}
            </span>
          )}
        </div>
        {congress.notes && (
          <p className="text-sm text-slate-500 mt-2">{congress.notes}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Fotos
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-3xl font-bold text-slate-900">{currentCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">de 100 máx.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Temas detectados
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-3xl font-bold text-slate-900">{currentTopicCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Extraídos por IA</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Referencias
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-3xl font-bold text-slate-900">{currentReferenceCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Bibliografía detectada</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900">Fotos del congreso</h3>
          <span className="text-xs text-slate-400">{currentCount} / 100</span>
        </div>
        <PhotoUploadZone
          congressId={id}
          userId={user.id}
          currentCount={currentCount}
          aiEnabled={process.env.MEDCONGRESS_AI_ENABLED === "true"}
        />
      </div>

      {/* Jobs status (live) */}
      <div className="mb-8">
        <JobsStatus congressId={id} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen del congreso</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Prepara una vista consolidada por temas y hallazgos.</p>
            <Link
              href={`/dashboard/congresos/${id}/resumen`}
              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              Ver
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exportar</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Genera entregables cuando el flujo este disponible.</p>
            <Link
              href={`/dashboard/congresos/${id}/exportar`}
              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              Abrir
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Reports Section */}
      <div className="mb-10 pt-6 border-t border-slate-100">
        <CongressReport 
          congressId={id} 
          reports={reports || []} 
        />
      </div>

      {/* Gallery */}
      <div className="pt-6 border-t border-slate-100">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">Galería de Evidencia</h3>
          <p className="text-xs text-slate-500">Analiza tus fotos para alimentar la IA</p>
        </div>
        {currentCount > 0 && (
          <PhotoGridWrapper congressId={id} />
        )}
      </div>
    </div>
  )
}

async function PhotoGridWrapper({ congressId }: { congressId: string }) {
  const supabase = await createClient()

  const { data: images } = await supabase
    .from("congress_images")
    .select(`
      id, 
      storage_path, 
      storage_path_optimized, 
      storage_path_thumbnail, 
      original_filename, 
      file_size, 
      status, 
      created_at,
      ocr_results(cleaned_text)
    `)
    .eq("congress_id", congressId)
    .order("created_at", { ascending: true })

  if (!images?.length) return null

  const thumbnailPaths = images.map((image) => image.storage_path_thumbnail ?? image.storage_path_optimized ?? image.storage_path)
  const optimizedPaths = images.map((image) => image.storage_path_optimized ?? image.storage_path)

  const [{ data: thumbSignedUrls }, { data: optimizedSignedUrls }] = await Promise.all([
    supabase.storage
      .from("congress-photos")
      .createSignedUrls(thumbnailPaths, 3600),
    supabase.storage
      .from("congress-photos")
      .createSignedUrls(optimizedPaths, 3600),
  ])

  const initialImages = images.map((img, idx) => {
    const ocrData = img.ocr_results as unknown as { cleaned_text: string }[] | undefined
    return {
      ...img,
      ocr_text: ocrData?.[0]?.cleaned_text || null,
      signedUrl: optimizedSignedUrls?.[idx]?.signedUrl ?? null,
      optimizedSignedUrl: optimizedSignedUrls?.[idx]?.signedUrl ?? null,
      thumbSignedUrl: thumbSignedUrls?.[idx]?.signedUrl ?? null,
    }
  })


  return <PhotoGrid congressId={congressId} initialImages={initialImages} />
}
