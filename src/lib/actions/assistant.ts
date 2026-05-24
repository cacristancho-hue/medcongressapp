"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { enqueueTopicsExtraction, enqueueReportGeneration, enqueueReferenceVerification } from "@/lib/actions/queue"
import { extractCongressTopics } from "@/lib/actions/ai-processing"
import { generateAcademicReport } from "@/lib/actions/polyglot-reports"

// detailCode is a language-agnostic token; the client maps it to a localized
// string. label is derived client-side from `key`. Keeps the AI flow bilingual.
export type AssistantDetailCode =
  | "instantDone"
  | "instantFailRetry"
  | "alreadyRunning"
  | "queued"
  | "alreadyDone"
  | "noOcr"
  | "enqueueError"
  | "noPending"
  | "alreadyExists"

export interface AssistantStep {
  key: "topics" | "references" | "report"
  status: "queued" | "skipped" | "error" | "success"
  detailCode?: AssistantDetailCode
}

export interface AssistantResult {
  steps: AssistantStep[]
  errorCode?: "unauthorized"
}

const STALE_PROCESSING_MINUTES = 20

type ActiveJobRow = {
  job_type: "topics_extraction" | "report_generation" | "reference_verification"
  status: "pending" | "processing"
  started_at: string | null
}

function hasLiveActiveJobs(jobs: ActiveJobRow[] | null | undefined) {
  if (!jobs?.length) return false
  const staleCutoff = Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000
  return jobs.some((job) => {
    if (job.status === "pending") return true
    if (job.status !== "processing") return false
    if (!job.started_at) return true
    return new Date(job.started_at).getTime() >= staleCutoff
  })
}

/**
 * Smart orchestrator for the medical AI assistant.
 * Optimized for Vercel: Runs immediately for small data, enqueues for large.
 */
export async function runMedicalAssistant(
  congressId: string,
  language: "es" | "en" = "es"
): Promise<AssistantResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { steps: [], errorCode: "unauthorized" }

  // 1. Check existing data and active jobs
  const [
    { count: topicCount },
    { count: reportsCount },
    { count: ocrCount },
    { count: pendingRefsCount },
    { data: activeJobs },
  ] = await Promise.all([
    supabase.from("topics").select("id", { count: "exact", head: true }).eq("congress_id", congressId),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("congress_id", congressId).eq("user_id", user.id),
    supabase.from("ocr_results").select("congress_images!inner(congress_id)", { count: "exact", head: true }).eq("congress_images.congress_id", congressId),
    supabase.from("reference_candidates").select("id", { count: "exact", head: true })
      .eq("congress_id", congressId)
      .eq("user_id", user.id)
      .neq("verification_status", "verified")
      .neq("verification_status", "retracted"),
    supabase.from("ai_jobs")
      .select("job_type, status, started_at")
      .eq("congress_id", congressId)
      .in("status", ["pending", "processing"]),
  ])

  const steps: AssistantStep[] = []
  const isTopicsActive = hasLiveActiveJobs(activeJobs?.filter((j) => j.job_type === "topics_extraction") as ActiveJobRow[] | null | undefined)
  const isReportActive = hasLiveActiveJobs(activeJobs?.filter((j) => j.job_type === "report_generation") as ActiveJobRow[] | null | undefined)
  const isRefsActive = hasLiveActiveJobs(activeJobs?.filter((j) => j.job_type === "reference_verification") as ActiveJobRow[] | null | undefined)

  // DECISIÓN ESTRATÉGICA: Si hay menos de 10 imágenes, procesamos TODO en caliente (Hot Path)
  // para evitar la cola de Vercel que no tiene worker activo.
  const isSmallCongress = (ocrCount ?? 0) <= 12

  // 2. Topics
  if ((topicCount ?? 0) === 0 && (ocrCount ?? 0) > 0) {
    if (isSmallCongress) {
      try {
        await extractCongressTopics(congressId)
        steps.push({ key: "topics", status: "success", detailCode: "instantDone" })
      } catch (e) {
        steps.push({ key: "topics", status: "error", detailCode: "instantFailRetry" })
        await enqueueTopicsExtraction(congressId)
      }
    } else {
      if (isTopicsActive) {
        steps.push({ key: "topics", status: "queued", detailCode: "alreadyRunning" })
      } else {
        await enqueueTopicsExtraction(congressId)
        steps.push({ key: "topics", status: "queued", detailCode: "queued" })
      }
    }
  } else {
    steps.push({
      key: "topics",
      status: "skipped",
      detailCode: (topicCount ?? 0) > 0 ? "alreadyDone" : "noOcr",
    })
  }

  // 3. References (Siempre a cola porque son muchas llamadas API y tardan)
  if ((pendingRefsCount ?? 0) > 0) {
    if (isRefsActive) {
      steps.push({ key: "references", status: "queued", detailCode: "alreadyRunning" })
    } else {
      try {
        await enqueueReferenceVerification(congressId)
        steps.push({ key: "references", status: "queued", detailCode: "queued" })
      } catch (e) {
        steps.push({ key: "references", status: "error", detailCode: "enqueueError" })
      }
    }
  } else {
    steps.push({
      key: "references",
      status: "skipped",
      detailCode: (pendingRefsCount ?? 0) === 0 ? "noPending" : "noOcr",
    })
  }

  // 4. Report
  if ((reportsCount ?? 0) === 0 && (ocrCount ?? 0) > 0) {
    if (isSmallCongress) {
      try {
        await generateAcademicReport({ congressId, language })
        steps.push({ key: "report", status: "success", detailCode: "instantDone" })
      } catch (e) {
        steps.push({ key: "report", status: "error", detailCode: "instantFailRetry" })
        await enqueueReportGeneration({ congressId, language })
      }
    } else {
      if (isReportActive) {
        steps.push({ key: "report", status: "queued", detailCode: "alreadyRunning" })
      } else {
        await enqueueReportGeneration({ congressId, language })
        steps.push({ key: "report", status: "queued", detailCode: "queued" })
      }
    }
  } else {
    steps.push({
      key: "report",
      status: "skipped",
      detailCode: (reportsCount ?? 0) > 0 ? "alreadyExists" : "noOcr",
    })
  }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  revalidatePath(`/dashboard/congresos/${congressId}/resumen`)
  return { steps }
}
