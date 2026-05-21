"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { retryAiJob } from "@/lib/actions/queue"
import { Loader2, CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react"
import { clsx } from "clsx"

interface JobRow {
  id: string
  job_type: string
  status: "pending" | "processing" | "succeeded" | "completed" | "failed" | "cancelled"
  attempt_count: number
  error_message: string | null
  created_at: string
  finished_at: string | null
  image_id: string | null
  payload?: Record<string, unknown> | null
  result?: {
    stage?: string
    kind?: string
    imageCount?: number
    ocrCount?: number
    referenceCount?: number
    fullTextLength?: number
    provider?: string
    model?: string
    inputTokens?: number
    outputTokens?: number
    congressId?: string
    language?: string
  } | null
}

interface Props {
  congressId: string
  initialJobs?: JobRow[]
  analyzedImagesCount?: number
  processingImagesCount?: number
}

const TYPE_LABEL: Record<string, string> = {
  image_analysis: "Analisis de imagen",
  topics_extraction: "Extraccion de topicos",
  report_generation: "Reporte academico",
  reference_verification: "Verificacion bibliografica",
}

export default function JobsStatus({
  congressId,
  initialJobs = [],
  analyzedImagesCount = 0,
  processingImagesCount = 0,
}: Props) {
  const [jobs, setJobs] = useState<JobRow[]>(initialJobs)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    let mounted = true
    supabase
      .from("ai_jobs")
      .select("id, job_type, status, attempt_count, error_message, created_at, finished_at, image_id, payload, result")
      .eq("congress_id", congressId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (mounted && data) setJobs(data as JobRow[])
      })

    const channel = supabase
      .channel(`jobs:${congressId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_jobs",
          filter: `congress_id=eq.${congressId}`,
        },
        (payload) => {
          setJobs((prev) => {
            if (payload.eventType === "INSERT") return [payload.new as JobRow, ...prev]
            if (payload.eventType === "UPDATE") {
              return prev.map((j) =>
                j.id === (payload.new as JobRow).id ? (payload.new as JobRow) : j
              )
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((j) => j.id !== (payload.old as JobRow).id)
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [congressId])

  const pending = jobs.filter((j) => j.status === "pending").length
  const processing = jobs.filter((j) => j.status === "processing").length
  const succeeded = jobs.filter((j) => j.status === "succeeded" || j.status === "completed").length
  const failed = jobs.filter((j) => j.status === "failed").length
  const cancelled = jobs.filter((j) => j.status === "cancelled").length
  const stalePending = jobs.filter(isStalePending).length

  if (jobs.length === 0) return null

  const total = jobs.length
  const done = succeeded + failed + cancelled
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const livePending = Math.max(0, pending - stalePending)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
          Procesamiento IA
        </h4>
        <span className="text-xs text-slate-500">
          {done} / {total} ({percent}%)
        </span>
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <Stat icon={CheckCircle2} value={analyzedImagesCount} label="Fotos listas" tone="text-emerald-600" />
        <Stat icon={Loader2} value={processingImagesCount} label="Fotos en curso" tone="text-blue-600" spin />
        <Stat icon={Clock} value={livePending} label="Tareas en cola" tone="text-slate-500" />
        <Stat icon={XCircle} value={failed} label="Fallidos" tone="text-red-600" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-slate-500">
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5">
          Jobs activos: {processing}
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5">
          Jobs pendientes: {pending}
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5">
          Jobs viejos: {stalePending}
        </div>
      </div>

      {failed > 0 && (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-red-600 hover:underline">
            Ver errores ({failed})
          </summary>
          <ul className="mt-2 space-y-1 text-slate-600">
            {jobs
              .filter((j) => j.status === "failed")
              .slice(0, 5)
              .map((j) => (
                <li key={j.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[11px]">
                      <span className="font-mono">{TYPE_LABEL[j.job_type] ?? j.job_type}</span>
                      : {formatJobDetail(j)}
                    </div>
                    <RetryButton job={j} onRetry={router.refresh} />
                  </div>
                </li>
              ))}
          </ul>
        </details>
      )}

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-slate-500 hover:underline">
          Ver detalle de jobs
        </summary>
        <ul className="mt-2 space-y-2 text-slate-600">
          {jobs.slice(0, 5).map((j) => (
            <li key={j.id} className="text-[11px] rounded-lg border border-slate-100 bg-slate-50 p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[10px] uppercase text-slate-400">
                    {TYPE_LABEL[j.job_type] ?? j.job_type} · {j.status}
                  </div>
                  <div className="mt-1">{formatJobDetail(j)}</div>
                  {j.result?.stage && (
                    <div className="mt-1 text-[10px] text-slate-500">
                      Etapa: {j.result.stage}
                      {j.result.kind ? ` · ${j.result.kind}` : ""}
                      {typeof j.result.imageCount === "number" ? ` · imgs ${j.result.imageCount}` : ""}
                      {typeof j.result.ocrCount === "number" ? ` · ocr ${j.result.ocrCount}` : ""}
                      {typeof j.result.referenceCount === "number" ? ` · refs ${j.result.referenceCount}` : ""}
                    </div>
                  )}
                </div>
                {(j.status === "failed" || isStalePending(j)) && (
                  <RetryButton job={j} onRetry={router.refresh} />
                )}
              </div>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

function RetryButton({
  job,
  onRetry,
}: {
  job: JobRow
  onRetry: () => void
}) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await retryAiJob(job.id)
          onRetry()
        })
      }}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <RotateCcw className="h-3 w-3" />
      {job.status === "failed" ? "Reintentar" : "Reclamar"}
    </button>
  )
}

function formatJobDetail(job: JobRow) {
  const parts: string[] = []
  if (job.error_message) parts.push(job.error_message)
  if (job.result?.stage) parts.push(`stage=${job.result.stage}`)
  if (job.result?.provider) parts.push(`provider=${job.result.provider}`)
  if (job.result?.model) parts.push(`model=${job.result.model}`)
  if (!parts.length) return "sin detalle"
  return parts.join(" · ")
}

function isStalePending(job: JobRow) {
  if (job.status !== "pending") return false
  const created = new Date(job.created_at).getTime()
  return Number.isFinite(created) && Date.now() - created > 1000 * 60 * 20
}

function Stat({
  icon: Icon,
  value,
  label,
  tone,
  spin = false,
}: {
  icon: typeof Clock
  value: number
  label: string
  tone: string
  spin?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1">
        <Icon className={clsx("h-3.5 w-3.5", tone, spin && value > 0 && "animate-spin")} />
        <span className={clsx("text-sm font-semibold", tone)}>{value}</span>
      </div>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
