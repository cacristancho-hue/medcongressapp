import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { enqueueTopicsExtraction, enqueueReportGeneration, enqueueReferenceVerification } from "@/lib/actions/queue"
import { extractCongressTopics } from "@/lib/actions/ai-processing"
import { generateAcademicReport } from "@/lib/actions/polyglot-reports"

export interface AssistantStep {
  key: "topics" | "references" | "report"
  label: string
  status: "queued" | "skipped" | "error" | "success"
  detail?: string
}

export interface AssistantResult {
  steps: AssistantStep[]
  error?: string
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

  // DECISIÓN ESTRATÉGICA: Si hay menos de 10 imágenes, procesamos TODO en caliente (Hot Path)
  // para evitar la cola de Vercel que no tiene worker activo.
  const isSmallCongress = (ocrCount ?? 0) <= 12

  // 2. Topics
  if ((topicCount ?? 0) === 0 && (ocrCount ?? 0) > 0) {
    if (isSmallCongress) {
      try {
        await extractCongressTopics(congressId)
        steps.push({ key: "topics", label: "Tópicos clínicos", status: "success", detail: "Procesado al instante" })
      } catch (e) {
        steps.push({ key: "topics", label: "Tópicos clínicos", status: "error", detail: "Fallo inmediato, reintentando vía cola" })
        await enqueueTopicsExtraction(congressId)
      }
    } else {
      if (isTopicsActive) {
        steps.push({ key: "topics", label: "Tópicos clínicos", status: "queued", detail: "Procesamiento ya en curso" })
      } else {
        await enqueueTopicsExtraction(congressId)
        steps.push({ key: "topics", label: "Tópicos clínicos", status: "queued", detail: "Enviado a cola" })
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

  // 3. References (Siempre a cola porque son muchas llamadas API y tardan)
  if ((pendingRefsCount ?? 0) > 0) {
    if (isRefsActive) {
      steps.push({ key: "references", label: "Verificación bibliográfica", status: "queued", detail: "Procesamiento ya en curso" })
    } else {
      try {
        await enqueueReferenceVerification(congressId)
        steps.push({ key: "references", label: "Verificación bibliográfica", status: "queued", detail: "Enviado a cola" })
      } catch (e) {
        steps.push({ key: "references", label: "Verificación bibliográfica", status: "error", detail: "Error al encolar" })
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

  // 4. Report
  if ((reportsCount ?? 0) === 0 && (ocrCount ?? 0) > 0) {
    if (isSmallCongress) {
      try {
        await generateAcademicReport({ congressId, language })
        steps.push({ key: "report", label: "Reporte académico", status: "success", detail: "Generado al instante" })
      } catch (e) {
        steps.push({ key: "report", label: "Reporte académico", status: "error", detail: "Fallo inmediato, usando cola" })
        await enqueueReportGeneration({ congressId, language })
      }
    } else {
      if (isReportActive) {
        steps.push({ key: "report", label: "Reporte académico", status: "queued", detail: "Generación ya en curso" })
      } else {
        await enqueueReportGeneration({ congressId, language })
        steps.push({ key: "report", label: "Reporte académico", status: "queued", detail: "Enviado a cola" })
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
