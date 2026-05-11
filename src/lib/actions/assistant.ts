"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { enqueueTopicsExtraction, enqueueReportGeneration, enqueueReferenceVerification } from "@/lib/actions/queue"

export interface AssistantStep {
  key: "topics" | "references" | "report"
  label: string
  status: "queued" | "skipped" | "error"
  detail?: string
}

export interface AssistantResult {
  steps: AssistantStep[]
  error?: string
}

/**
 * Smart orchestrator for the medical AI assistant.
 * Enqueues missing phases as background jobs to avoid timeouts.
 */
export async function runMedicalAssistant(
  congressId: string,
  language: "es" | "en" = "es"
): Promise<AssistantResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { steps: [], error: "No autorizado" }

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
      .select("job_type, status")
      .eq("congress_id", congressId)
      .in("status", ["pending", "processing"]),
  ])

  const steps: AssistantStep[] = []
  const isTopicsActive = activeJobs?.some(j => j.job_type === "topics_extraction")
  const isReportActive = activeJobs?.some(j => j.job_type === "report_generation")
  const isRefsActive = activeJobs?.some(j => j.job_type === "reference_verification")

  // 2. Enqueue Topics if missing and not already running
  if ((topicCount ?? 0) === 0 && (ocrCount ?? 0) > 0) {
    if (isTopicsActive) {
      steps.push({ key: "topics", label: "Tópicos clínicos", status: "queued", detail: "Procesamiento ya en curso" })
    } else {
      try {
        await enqueueTopicsExtraction(congressId)
        steps.push({ key: "topics", label: "Tópicos clínicos", status: "queued", detail: "Enviado a cola" })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error desconocido"
        steps.push({ key: "topics", label: "Tópicos clínicos", status: "error", detail: msg })
      }
    }
  } else {
    steps.push({ 
      key: "topics", 
      label: "Tópicos clínicos", 
      status: "skipped", 
      detail: (topicCount ?? 0) > 0 ? "ya procesados" : "sin datos OCR" 
    })
  }

  // 3. Enqueue References if pending and not already running
  if ((pendingRefsCount ?? 0) > 0) {
    if (isRefsActive) {
      steps.push({ key: "references", label: "Verificación bibliográfica", status: "queued", detail: "Procesamiento ya en curso" })
    } else {
      try {
        await enqueueReferenceVerification(congressId)
        steps.push({ key: "references", label: "Verificación bibliográfica", status: "queued", detail: "Enviado a cola" })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error desconocido"
        steps.push({ key: "references", label: "Verificación bibliográfica", status: "error", detail: msg })
      }
    }
  } else {
    steps.push({ 
      key: "references", 
      label: "Verificación bibliográfica", 
      status: "skipped", 
      detail: (pendingRefsCount ?? 0) === 0 ? "sin pendientes" : "sin datos OCR" 
    })
  }

  // 4. Enqueue Report if missing and not already running
  if ((reportsCount ?? 0) === 0 && (ocrCount ?? 0) > 0) {
    if (isReportActive) {
      steps.push({ key: "report", label: "Reporte académico", status: "queued", detail: "Generación ya en curso" })
    } else {
      try {
        await enqueueReportGeneration({ congressId, language })
        steps.push({ key: "report", label: "Reporte académico", status: "queued", detail: "Enviado a cola" })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error desconocido"
        steps.push({ key: "report", label: "Reporte académico", status: "error", detail: msg })
      }
    }
  } else {
    steps.push({ 
      key: "report", 
      label: "Reporte académico", 
      status: "skipped", 
      detail: (reportsCount ?? 0) > 0 ? "ya existe" : "sin datos OCR" 
    })
  }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  revalidatePath(`/dashboard/congresos/${congressId}/resumen`)
  return { steps }
}
