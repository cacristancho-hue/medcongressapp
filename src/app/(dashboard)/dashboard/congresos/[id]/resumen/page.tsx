import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  ArrowLeft,
  FileText,
  Hash,
  Images,
  BookCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  CircleHelp,
  XCircle,
  Ban,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import AiAssistantButton from "@/components/congresses/ai-assistant-button"
import JobsStatus from "@/components/congresses/jobs-status"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

interface OcrSnippet {
  raw_text: string | null
  cleaned_text: string | null
}

interface ReferenceRow {
  id: string
  detected_title: string | null
  detected_authors: string | null
  detected_year: string | null
  detected_journal: string | null
  detected_doi: string | null
  detected_pmid: string | null
  verification_status: string
  confidence_score: number | null
}

interface TopicRow {
  id: string
  name: string
  category: string | null
  description: string | null
  image_count: number
}

interface ReportRow {
  id: string
  title: string
  content: string
  report_type: string
  created_at: string
}

interface ProcessJobRow {
  id: string
  job_type: string
  status: string
  attempt_count: number
  error_message: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
  result:
      | {
        stage?: string
        kind?: string
        imageCount?: number
        ocrCount?: number
        referenceCount?: number
        topicCount?: number
        topicsCreated?: number
        processedCount?: number
        retractedCount?: number
        fullTextLength?: number
        preparedBytes?: number
        previewBytes?: number
        provider?: string
        model?: string
        inputTokens?: number
        outputTokens?: number
        optimizedBytes?: number
        thumbnailBytes?: number
        congressId?: string
        language?: string
      }
    | null
}

const STATUS_META: Record<
  string,
  { label: string; icon: typeof CheckCircle2; tone: string; bg: string }
> = {
  verified: {
    label: "Verificadas",
    icon: CheckCircle2,
    tone: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  partially_verified: {
    label: "Parciales",
    icon: AlertTriangle,
    tone: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  ambiguous: {
    label: "Ambiguas",
    icon: CircleHelp,
    tone: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  not_verified: {
    label: "No verificadas",
    icon: XCircle,
    tone: "text-slate-600",
    bg: "bg-slate-50 border-slate-200",
  },
  retracted: {
    label: "Retractadas",
    icon: Ban,
    tone: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
}

export default async function ResumenPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: congress } = await supabase
    .from("congresses")
    .select("id, name, location, start_date, end_date, specialty, notes")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!congress) notFound()

  // Pull everything we need in parallel.
  const [
    photosRes,
    ocrTextsRes,
    topicsRes,
    referencesRes,
    reportsRes,
    jobsRes,
  ] = await Promise.all([
    supabase
      .from("congress_images")
      .select("id, ai_status", { count: "exact" })
      .eq("congress_id", id),
    supabase
      .from("ocr_results")
      .select("raw_text, cleaned_text, congress_images!inner(congress_id)")
      .eq("congress_images.congress_id", id),
    supabase
      .from("topics")
      .select("id, name, category, description, image_topics(image_id)")
      .eq("congress_id", id),
    supabase
      .from("reference_candidates")
      .select(
        "id, detected_title, detected_authors, detected_year, detected_journal, detected_doi, detected_pmid, verification_status, confidence_score"
      )
      .eq("congress_id", id)
      .order("verification_status", { ascending: true }),
    supabase
      .from("reports")
      .select("id, title, content, report_type, created_at")
      .eq("congress_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_jobs")
      .select("id, job_type, status, attempt_count, error_message, created_at, started_at, finished_at, result")
      .eq("congress_id", id)
      .eq("user_id", user.id)
      .in("job_type", ["image_analysis", "topics_extraction", "report_generation", "reference_verification"])
      .order("created_at", { ascending: false })
      .limit(12),
  ])

  const totalPhotos = photosRes.count ?? 0
  const analyzedPhotos = (photosRes.data ?? []).filter(
    (p) => p.ai_status === "ai_done"
  ).length

  const ocrSnippets = (ocrTextsRes.data ?? []) as unknown as OcrSnippet[]
  // Count literal OCR characters (raw_text), not the AI summary. Legacy fallback.
  const ocrCharacters = ocrSnippets.reduce(
    (sum, row) => sum + ((row.raw_text ?? row.cleaned_text)?.length ?? 0),
    0
  )

  const topics: TopicRow[] = ((topicsRes.data ?? []) as Array<{
    id: string
    name: string
    category: string | null
    description: string | null
    image_topics: Array<{ image_id: string }> | null
  }>).map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    description: t.description,
    image_count: t.image_topics?.length ?? 0,
  }))

  const topicsByCategory = topics.reduce<Record<string, TopicRow[]>>(
    (acc, topic) => {
      const key = topic.category ?? "Sin categoría"
      acc[key] = acc[key] ?? []
      acc[key].push(topic)
      return acc
    },
    {}
  )

  const references = (referencesRes.data ?? []) as ReferenceRow[]
  const referencesByStatus = references.reduce<Record<string, ReferenceRow[]>>(
    (acc, ref) => {
      const status = ref.verification_status ?? "not_verified"
      acc[status] = acc[status] ?? []
      acc[status].push(ref)
      return acc
    },
    {}
  )

  const verifiedCount =
    (referencesByStatus.verified?.length ?? 0) +
    (referencesByStatus.partially_verified?.length ?? 0)
  const totalReferences = references.length

  const reports = (reportsRes.data ?? []) as ReportRow[]
  const latestReport = reports[0] ?? null
  const processJobs = (jobsRes.data ?? []) as ProcessJobRow[]
  const latestImageJob = processJobs.find((job) => job.job_type === "image_analysis") ?? null
  const latestTopicsJob = processJobs.find((job) => job.job_type === "topics_extraction") ?? null
  const latestReportJob = processJobs.find((job) => job.job_type === "report_generation") ?? null
  const latestFinishedReportJob =
    processJobs.find((job) => job.job_type === "report_generation" && job.status === "succeeded") ?? null
  const latestFailedReportJob =
    processJobs.find((job) => job.job_type === "report_generation" && job.status === "failed") ?? null
  const latestReferenceJob =
    processJobs.find((job) => job.job_type === "reference_verification") ?? null
  const latestRelevantJob = processJobs[0] ?? null

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-2">
        <Link
          href={`/dashboard/congresos/${id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al congreso
        </Link>
      </div>

      <header className="mb-6">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Resumen consolidado
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          {congress.name}
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
          {congress.specialty && <span>{congress.specialty}</span>}
          {congress.location && <span>📍 {congress.location}</span>}
          {congress.start_date && (
            <span>
              📅 {new Date(congress.start_date).toLocaleDateString("es-CO", {
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
      </header>

      {/* Jobs progress (realtime) */}
      <div className="mb-8">
        <JobsStatus congressId={id} />
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard
          icon={Images}
          label="Fotos analizadas"
          value={`${analyzedPhotos} / ${totalPhotos}`}
        />
        <StatCard
          icon={FileText}
          label="Caracteres OCR"
          value={ocrCharacters.toLocaleString("es-CO")}
        />
        <StatCard
          icon={Hash}
          label="Tópicos detectados"
          value={topics.length}
        />
        <StatCard
          icon={BookCheck}
          label="Referencias verificadas"
          value={`${verifiedCount} / ${totalReferences}`}
        />
      </section>

      {/* Asistente IA — botón unificado comercial */}
      <section className="mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              Asistente clínico
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Procesa tu congreso con IA: extrae tópicos, verifica referencias y
              genera un reporte académico estructurado en un solo paso.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <AiAssistantButton congressId={id} />
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Trazabilidad del procesamiento
          </h2>
          <Link
            href={`/dashboard/congresos/${id}#jobs`}
            className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
          >
            <CircleHelp className="h-3 w-3" />
            Ver cola completa
          </Link>
        </div>
        {latestRelevantJob ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TraceCard
              title="Última foto"
              job={latestImageJob}
              fallbackText="No hay análisis de imagen reciente."
            />
            <TraceCard
              title="Últimos tópicos"
              job={latestTopicsJob}
              fallbackText="No hay extracción de tópicos reciente."
            />
            <TraceCard
              title="Último reporte"
              job={latestReportJob}
              fallbackText="No hay reporte reciente en cola."
            />
            <TraceCard
              title="Última verificación"
              job={latestReferenceJob}
              fallbackText="No hay verificación bibliográfica reciente."
            />
            <TraceCard
              title="Última tarea"
              job={latestRelevantJob}
              fallbackText="No hay tareas recientes."
            />
          </div>
        ) : (
          <EmptyState text="Aún no hay trazabilidad de jobs para este congreso. Cuando generes análisis, verás aquí la etapa, error o resultado del último proceso." />
        )}
      </section>

      {/* Reportes */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Reporte académico
          </h2>
          <Link
            href={`/dashboard/congresos/${id}#reports`}
            className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Generar nuevo
          </Link>
        </div>
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <MiniTrace
            label="Último reporte"
            value={formatReportState(latestReportJob)}
            helper={reportJobHelper(latestReportJob)}
          />
          <MiniTrace
            label="Último reporte OK"
            value={formatReportState(latestFinishedReportJob)}
            helper={reportJobHelper(latestFinishedReportJob)}
          />
          <MiniTrace
            label="Último reporte fallido"
            value={formatReportState(latestFailedReportJob)}
            helper={reportJobHelper(latestFailedReportJob)}
          />
        </div>
        {latestReport ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{latestReport.title}</CardTitle>
              <p className="text-xs text-slate-500">
                {new Date(latestReport.created_at).toLocaleString("es-CO")}
                {reports.length > 1 && ` · ${reports.length} versiones`}
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm prose-slate max-w-none pt-0 font-plex-mono">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {latestReport.content}
              </ReactMarkdown>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            text="Aún no hay reportes. Genera uno desde la página del congreso para que la IA consolide todo el OCR en un esquema académico estructurado."
          />
        )}
      </section>

      {/* Tópicos */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Tópicos detectados
          </h2>
          <span className="text-xs text-slate-500">
            {topics.length} tópico{topics.length === 1 ? "" : "s"} en {Object.keys(topicsByCategory).length} categoría{Object.keys(topicsByCategory).length === 1 ? "" : "s"}
          </span>
        </div>
        {topics.length === 0 ? (
          <EmptyState text="Aún no hay tópicos. Usa el asistente clínico arriba para extraerlos del OCR existente." />
        ) : (
          <div className="space-y-4">
            {Object.entries(topicsByCategory).map(([category, items]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wide text-slate-500">
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex flex-wrap gap-1.5">
                  {items.map((topic) => (
                    <span
                      key={topic.id}
                      title={topic.description ?? undefined}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                    >
                      {topic.name}
                      {topic.image_count > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ×{topic.image_count}
                        </span>
                      )}
                    </span>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Referencias */}
      <section className="mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Bibliografía detectada
          </h2>
          <span className="text-xs text-slate-500">
            {totalReferences} candidato{totalReferences === 1 ? "" : "s"}
          </span>
        </div>
        {totalReferences === 0 ? (
          <EmptyState text="Aún no se detectaron referencias bibliográficas en las fotos analizadas." />
        ) : (
          <div className="space-y-4">
            {(["verified", "partially_verified", "ambiguous", "retracted", "not_verified"] as const).map(
              (status) => {
                const list = referencesByStatus[status] ?? []
                if (list.length === 0) return null
                const meta = STATUS_META[status]
                const Icon = meta.icon
                return (
                  <div
                    key={status}
                    className={`rounded-lg border ${meta.bg} px-4 py-3`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${meta.tone}`} />
                      <h3 className={`text-xs font-semibold ${meta.tone}`}>
                        {meta.label} ({list.length})
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {list.slice(0, 12).map((ref) => (
                        <li key={ref.id} className="text-xs text-slate-700">
                          <p className="font-medium">
                            {ref.detected_title ?? "(sin título detectado)"}
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            {[
                              ref.detected_authors,
                              ref.detected_journal,
                              ref.detected_year,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          {(ref.detected_doi || ref.detected_pmid) && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {ref.detected_doi && `DOI: ${ref.detected_doi}`}
                              {ref.detected_doi && ref.detected_pmid && " · "}
                              {ref.detected_pmid && `PMID: ${ref.detected_pmid}`}
                              {ref.confidence_score != null &&
                                ` · score ${ref.confidence_score.toFixed(2)}`}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    {list.length > 12 && (
                      <p className="text-[10px] text-slate-400 mt-2">
                        +{list.length - 12} más
                      </p>
                    )}
                  </div>
                )
              }
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText
  label: string
  value: string | number
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-2 text-slate-500">
          <Icon className="h-3.5 w-3.5" />
          <span className="text-[11px] uppercase tracking-wide font-medium">
            {label}
          </span>
        </div>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <p className="text-sm text-slate-500 mx-auto max-w-md">{text}</p>
      </CardContent>
    </Card>
  )
}

function MiniTrace({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
        <p className="mt-1 text-[11px] text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  )
}

function TraceCard({
  title,
  job,
  fallbackText,
}: {
  title: string
  job: ProcessJobRow | null
  fallbackText: string
}) {
  const tone = !job
    ? "border-slate-200 bg-slate-50"
    : job.status === "failed"
      ? "border-red-200 bg-red-50"
      : job.status === "processing"
        ? "border-blue-200 bg-blue-50"
        : job.status === "pending"
          ? "border-amber-200 bg-amber-50"
          : "border-emerald-200 bg-emerald-50"

  return (
    <Card className={tone}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {job ? describeJobStatus(job.status) : "Sin datos"}
            </p>
          </div>
          {job?.result?.stage && (
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {job.result.stage}
            </span>
          )}
        </div>
        <div className="mt-3 space-y-1 text-[11px] text-slate-600">
          {job ? (
            <>
              <p>{job.error_message ? `Error: ${job.error_message}` : fallbackText}</p>
              <p>Creado: {new Date(job.created_at).toLocaleString("es-CO")}</p>
              {job.started_at && <p>Inició: {new Date(job.started_at).toLocaleString("es-CO")}</p>}
              {job.finished_at && <p>Terminó: {new Date(job.finished_at).toLocaleString("es-CO")}</p>}
              {(job.result?.imageCount != null ||
                job.result?.ocrCount != null ||
                job.result?.referenceCount != null ||
                job.result?.topicCount != null ||
                job.result?.topicsCreated != null ||
                job.result?.processedCount != null ||
                job.result?.retractedCount != null ||
                job.result?.provider ||
                job.result?.model) && (
                <p className="text-slate-500">
                  {job.result?.imageCount != null ? `imgs ${job.result.imageCount}` : ""}
                  {job.result?.ocrCount != null
                    ? `${job.result?.imageCount != null ? " · " : ""}ocr ${job.result.ocrCount}`
                    : ""}
                  {job.result?.referenceCount != null
                    ? `${job.result?.imageCount != null || job.result?.ocrCount != null ? " · " : ""}refs ${job.result.referenceCount}`
                    : ""}
                  {job.result?.topicCount != null
                    ? `${job.result?.imageCount != null || job.result?.ocrCount != null || job.result?.referenceCount != null ? " · " : ""}topics ${job.result.topicCount}`
                    : ""}
                  {job.result?.topicsCreated != null
                    ? `${job.result?.imageCount != null || job.result?.ocrCount != null || job.result?.referenceCount != null || job.result?.topicCount != null ? " · " : ""}created ${job.result.topicsCreated}`
                    : ""}
                  {job.result?.processedCount != null
                    ? `${job.result?.imageCount != null || job.result?.ocrCount != null || job.result?.referenceCount != null || job.result?.topicCount != null || job.result?.topicsCreated != null ? " · " : ""}processed ${job.result.processedCount}`
                    : ""}
                  {job.result?.retractedCount != null
                    ? `${job.result?.imageCount != null || job.result?.ocrCount != null || job.result?.referenceCount != null || job.result?.topicCount != null || job.result?.topicsCreated != null || job.result?.processedCount != null ? " · " : ""}retracted ${job.result.retractedCount}`
                    : ""}
                  {(job.result?.provider || job.result?.model) && (
                    <>
                      {(job.result?.imageCount != null ||
                        job.result?.ocrCount != null ||
                        job.result?.referenceCount != null ||
                        job.result?.topicCount != null ||
                        job.result?.topicsCreated != null ||
                        job.result?.processedCount != null ||
                        job.result?.retractedCount != null) && " · "}
                      {job.result?.provider}
                      {job.result?.provider && job.result?.model ? " / " : ""}
                      {job.result?.model}
                    </>
                  )}
                </p>
              )}
            </>
          ) : (
            <p>{fallbackText}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function describeJobStatus(status: string) {
  if (status === "failed") return "Falló"
  if (status === "processing") return "Procesando"
  if (status === "pending") return "En cola"
  if (status === "cancelled") return "Cancelado"
  if (status === "succeeded" || status === "completed") return "Listo"
  return status
}

function formatReportState(job: ProcessJobRow | null) {
  if (!job) return "Sin intentos"
  return describeJobStatus(job.status)
}

function reportJobHelper(job: ProcessJobRow | null) {
  if (!job) return "Todavía no hay jobs de reporte."
  const parts: string[] = []
  if (job.result?.stage) parts.push(`etapa ${job.result.stage}`)
  if (job.started_at && job.finished_at) {
    parts.push(`duró ${formatDuration(job.started_at, job.finished_at)}`)
  } else if (job.started_at && !job.finished_at) {
    parts.push("en ejecución")
  } else {
    parts.push("aún no inicia")
  }
  if (job.error_message) parts.push(job.error_message)
  if (job.result?.imageCount != null) parts.push(`${job.result.imageCount} fotos`)
  if (job.result?.referenceCount != null) parts.push(`${job.result.referenceCount} refs`)
  if (job.result?.ocrCount != null) parts.push(`${job.result.ocrCount} OCR`)
  return parts.join(" · ")
}

function formatDuration(startedAt: string, finishedAt: string) {
  const started = new Date(startedAt).getTime()
  const finished = new Date(finishedAt).getTime()
  if (!Number.isFinite(started) || !Number.isFinite(finished) || finished < started) return "0s"
  const seconds = Math.max(0, Math.round((finished - started) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}m ${rest}s`
}
