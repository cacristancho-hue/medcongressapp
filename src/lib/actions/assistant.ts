"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { extractCongressTopics } from "@/lib/actions/ai-processing"
import { generateAcademicReport } from "@/lib/actions/polyglot-reports"
import { verifyCongressReferences } from "@/lib/actions/references"

export interface AssistantStep {
  key: "topics" | "references" | "report"
  label: string
  status: "skipped" | "success" | "error"
  detail?: string
}

export interface AssistantResult {
  steps: AssistantStep[]
  error?: string
}

/**
 * Single-button orchestrator for the medical AI assistant.
 * Runs whichever phases are missing for a given congress, in the order:
 *   1. Topics extraction (if zero topics).
 *   2. Reference verification (if any pending references).
 *   3. Academic report generation (if no report yet).
 * Each step is independent: if one fails, the others still run.
 */
export async function runMedicalAssistant(
  congressId: string,
  language: "es" | "en" = "es"
): Promise<AssistantResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { steps: [], error: "No autorizado" }

  const { data: ownedCongress } = await supabase
    .from("congresses")
    .select("id")
    .eq("id", congressId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!ownedCongress) return { steps: [], error: "No autorizado" }

  // Snapshot what already exists to decide which phases to run.
  const [
    { count: topicCount },
    { count: pendingRefsCount },
    { count: reportsCount },
    { count: ocrCount },
  ] = await Promise.all([
    supabase
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("congress_id", congressId),
    supabase
      .from("reference_candidates")
      .select("id", { count: "exact", head: true })
      .eq("congress_id", congressId)
      .eq("user_id", user.id)
      .neq("verification_status", "verified")
      .neq("verification_status", "retracted"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("congress_id", congressId)
      .eq("user_id", user.id),
    supabase
      .from("ocr_results")
      .select("congress_images!inner(congress_id)", { count: "exact", head: true })
      .eq("congress_images.congress_id", congressId),
  ])

  const steps: AssistantStep[] = []

  // 1. Topics
  if ((topicCount ?? 0) === 0 && (ocrCount ?? 0) > 0) {
    const r = await extractCongressTopics(congressId)
    steps.push({
      key: "topics",
      label: "Tópicos clínicos",
      status: r.success ? "success" : "error",
      detail: r.success
        ? `${r.topicsCreated ?? 0} tópicos · ${r.linksCreated ?? 0} enlaces`
        : r.error,
    })
  } else {
    steps.push({
      key: "topics",
      label: "Tópicos clínicos",
      status: "skipped",
      detail: (topicCount ?? 0) > 0 ? "ya extraídos" : "sin OCR previo",
    })
  }

  // 2. References
  if ((pendingRefsCount ?? 0) > 0) {
    const r = await verifyCongressReferences(congressId)
    steps.push({
      key: "references",
      label: "Verificación bibliográfica",
      status: r.success ? "success" : "error",
      detail: r.success
        ? `${r.processed ?? 0} verificadas${r.retracted ? `, ${r.retracted} retractadas` : ""}`
        : r.error,
    })
  } else {
    steps.push({
      key: "references",
      label: "Verificación bibliográfica",
      status: "skipped",
      detail: "sin pendientes",
    })
  }

  // 3. Academic report
  if ((reportsCount ?? 0) === 0 && (ocrCount ?? 0) > 0) {
    const r = await generateAcademicReport(congressId, language)
    steps.push({
      key: "report",
      label: "Reporte académico",
      status: r.success ? "success" : "error",
      detail: r.success ? "reporte generado" : r.error,
    })
  } else {
    steps.push({
      key: "report",
      label: "Reporte académico",
      status: "skipped",
      detail:
        (reportsCount ?? 0) > 0
          ? "ya existe (genera otro desde el congreso)"
          : "sin OCR previo",
    })
  }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  revalidatePath(`/dashboard/congresos/${congressId}/resumen`)
  return { steps }
}
