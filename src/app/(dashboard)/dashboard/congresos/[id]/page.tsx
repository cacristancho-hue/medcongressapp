import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PhotoUploadZone from "@/components/congresses/photo-upload-zone"
import BulkAnalysisButton from "@/components/congresses/bulk-analysis-button"
import ReanalyzeButton from "@/components/congresses/reanalyze-button"
import CongressReport from "@/components/congresses/congress-report"
import JobsStatus from "@/components/congresses/jobs-status"
import CongressPresence from "@/components/congresses/congress-presence"

import DeleteCongressButton from "./delete-congress-button"
import { getImageFastPathLimit } from "@/lib/plan-limits"

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
    { data: aiLimits },
    { count: photoCount },
    { count: analyzedCount },
    { count: processingCount },
    { count: topicCount },
    { count: referenceCount },
    { data: reports }
  ] = await Promise.all([
    supabase
      .from("congresses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("ai_usage_limits")
      .select("plan, monthly_image_quota")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("congress_images")
      .select("*", { count: "exact", head: true })
      .eq("congress_id", id)
      .is("deleted_at", null),
    supabase
      .from("congress_images")
      .select("*", { count: "exact", head: true })
      .eq("congress_id", id)
      .is("deleted_at", null)
      .or("ai_status.eq.ai_done,ocr_status.eq.ocr_done"),
    supabase
      .from("congress_images")
      .select("*", { count: "exact", head: true })
      .eq("congress_id", id)
      .is("deleted_at", null)
      .or("ai_status.eq.ai_pending,ocr_status.eq.ocr_pending,ai_status.eq.processing,ocr_status.eq.processing"),
    supabase
      .from("topics")
      .select("*", { count: "exact", head: true })
      .eq("congress_id", id),
    supabase
      .from("reference_candidates")
      .select("*", { count: "exact", head: true })
      .eq("congress_id", id)
      .is("deleted_at", null),
    supabase
      .from("reports")
      .select("*")
      .eq("congress_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ])

  if (!congress) notFound()

  const currentCount = photoCount ?? 0
  const currentAnalyzedCount = analyzedCount ?? 0
  const currentProcessingCount = processingCount ?? 0
  const currentTopicCount = topicCount ?? 0
  const currentReferenceCount = referenceCount ?? 0
  const fastPathLimit = getImageFastPathLimit(aiLimits?.plan, aiLimits?.monthly_image_quota)

  // Sessions for the report scope selector (RLS scopes to current user).
  const { data: reportSessions } = await supabase
    .from("congress_sessions")
    .select("id, title")
    .eq("congress_id", id)
    .order("session_order", { ascending: true })

  // Presence display name: full_name from profile, fallback to email.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle()
  const displayName = profile?.full_name ?? user.email ?? "Usuario"

  return (
    <div className="max-w-4xl mx-auto">
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
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{congress.name}</h2>
            <DeleteCongressButton congressId={id} congressName={congress.name} />
          </div>
          <CongressPresence
            congressId={id}
            currentUserId={user.id}
            currentUserName={displayName}
          />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          {congress.specialty && (
            <span className="text-xs text-slate-500 font-medium">{congress.specialty}</span>
          )}
          {congress.location && (
            <span className="text-[10px] text-slate-400">📍 {congress.location}</span>
          )}
          {congress.start_date && (
            <span className="text-[10px] text-slate-400" suppressHydrationWarning>
              📅{" "}
              {new Date(congress.start_date).toLocaleDateString("es-CO", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Stats - 3 columns even on mobile for compactness */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Card className="shadow-none border-slate-100">
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              Fotos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <p className="text-xl font-black text-slate-900 leading-none">{currentCount}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-slate-100">
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              Temas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <p className="text-xl font-black text-slate-900 leading-none">{currentTopicCount}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-slate-100">
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              Citas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <p className="text-xl font-black text-slate-900 leading-none">{currentReferenceCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Galería de fotos</h3>
            <BulkAnalysisButton congressId={id} photoCount={currentCount} />
            <ReanalyzeButton congressId={id} photoCount={currentCount} />
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
            {currentCount}/100
          </span>
        </div>
        <PhotoUploadZone
          congressId={id}
          userId={user.id}
          currentCount={currentCount}
          aiEnabled={process.env.MEDCONGRESS_AI_ENABLED === "true"}
          fastPathLimit={fastPathLimit}
        />
      </div>

      {/* Jobs status (live) */}
      <div className="mb-8">
        <JobsStatus
          congressId={id}
          analyzedImagesCount={currentAnalyzedCount}
          processingImagesCount={currentProcessingCount}
        />
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
          sessions={(reportSessions ?? []).map((s) => ({ id: s.id, title: s.title }))}
        />
      </div>

      {/* Discovery Section (Topics + Gallery) */}
      <div className="pt-6 border-t border-slate-100">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-slate-900">Hallazgos y Evidencia</h3>
          <p className="text-xs text-slate-500">Explora el contenido organizado por temas clínicos</p>
        </div>
        
        {currentCount > 0 && (
          <CongressDiscovery congressId={id} />
        )}
      </div>
    </div>
  )
}

async function CongressDiscovery({ congressId }: { congressId: string }) {
  const supabase = await createClient()

  // 1. Obtener tópicos y sus relaciones
  const { data: topicsData } = await supabase
    .from("topics")
    .select(`
      id, 
      name, 
      category, 
      description,
      image_topics(image_id)
    `)
    .eq("congress_id", congressId)

  // 2. Obtener imágenes
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
      ai_status,
      ocr_status,
      created_at,
      session_id,
      captured_at,
      ocr_results(raw_text, cleaned_text, image_type),
      image_topics(topic_id)
    `)
    .eq("congress_id", congressId)
    .order("created_at", { ascending: true })

  if (!images?.length) return null

  // Sessions for this congress (ponencias) — for grouping/assignment UI.
  // RLS already scopes congress_sessions to the current user.
  const { data: sessionsData } = await supabase
    .from("congress_sessions")
    .select("id, title, speaker, room, session_order")
    .eq("congress_id", congressId)
    .order("session_order", { ascending: true })

  // Prepara URLs firmadas
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
    const ocrData = img.ocr_results as unknown as { raw_text: string | null; cleaned_text: string | null; image_type: string | null }[] | undefined
    const topicRelations = (img.image_topics as unknown as Array<{ topic_id: string }>) || []
    const topicIds = topicRelations.map(it => it.topic_id)
    return {
      ...img,
      topic_ids: topicIds,
      session_id: (img as { session_id?: string | null }).session_id ?? null,
      image_type: ocrData?.[0]?.image_type ?? null,
      ocr_text: ocrData?.[0]?.raw_text || ocrData?.[0]?.cleaned_text || null,
      signedUrl: optimizedSignedUrls?.[idx]?.signedUrl ?? null,
      optimizedSignedUrl: optimizedSignedUrls?.[idx]?.signedUrl ?? null,
      thumbSignedUrl: thumbSignedUrls?.[idx]?.signedUrl ?? null,
    }
  })

  const topics = (topicsData ?? []).map(t => {
    const relations = (t.image_topics as unknown as Array<{ image_id: string }>) || []
    return {
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description,
      image_count: relations.length
    }
  })

  const sessions = (sessionsData ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    speaker: s.speaker,
    room: s.room,
  }))

  return (
    <DiscoveryClient
      congressId={congressId}
      initialImages={initialImages}
      topics={topics}
      sessions={sessions}
    />
  )
}

import DiscoveryClient from "@/components/congresses/discovery-client"

