"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import { clsx } from "clsx"

interface JobRow {
  id: string
  job_type: string
  status: "pending" | "processing" | "succeeded" | "failed" | "cancelled"
  attempt_count: number
  error_message: string | null
  created_at: string
  finished_at: string | null
  image_id: string | null
}

interface Props {
  congressId: string
  initialJobs?: JobRow[]
}

const TYPE_LABEL: Record<string, string> = {
  image_analysis: "Análisis de imagen",
  topics_extraction: "Extracción de tópicos",
  report_generation: "Reporte académico",
  reference_verification: "Verificación bibliográfica",
}

export default function JobsStatus({ congressId, initialJobs = [] }: Props) {
  const [jobs, setJobs] = useState<JobRow[]>(initialJobs)

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch (in case server didn't pre-load).
    let mounted = true
    supabase
      .from("ai_jobs")
      .select(
        "id, job_type, status, attempt_count, error_message, created_at, finished_at, image_id"
      )
      .eq("congress_id", congressId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (mounted && data) setJobs(data as JobRow[])
      })

    // Realtime subscription: any change in ai_jobs for this congress.
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
            if (payload.eventType === "INSERT") {
              return [payload.new as JobRow, ...prev]
            }
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
  const succeeded = jobs.filter((j) => j.status === "succeeded").length
  const failed = jobs.filter((j) => j.status === "failed").length

  if (jobs.length === 0) return null

  const total = jobs.length
  const done = succeeded + failed
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

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

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat icon={Clock} value={pending} label="Pendientes" tone="text-slate-500" />
        <Stat
          icon={Loader2}
          value={processing}
          label="En curso"
          tone="text-blue-600"
          spin
        />
        <Stat icon={CheckCircle2} value={succeeded} label="OK" tone="text-emerald-600" />
        <Stat icon={XCircle} value={failed} label="Fallidos" tone="text-red-600" />
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
                <li key={j.id} className="text-[11px]">
                  <span className="font-mono">{TYPE_LABEL[j.job_type] ?? j.job_type}</span>
                  : {j.error_message ?? "error desconocido"}
                </li>
              ))}
          </ul>
        </details>
      )}
    </div>
  )
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
