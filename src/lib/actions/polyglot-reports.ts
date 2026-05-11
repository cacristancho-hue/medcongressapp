"use server"

import { revalidatePath } from "next/cache"
import { recordAiUsage } from "@/lib/ai-usage"
import { generateReport } from "@/lib/ai/router"
import { withAction } from "@/lib/with-action"

interface ReportInput {
  congressId: string
  language: "es" | "en"
}

export const generateAcademicReport = withAction({
  name: "ai.report_generation",
  rateLimit: "report_generation",
  quota: "report_generation",
  requiresAi: true,
})(async ({ user, supabase }, input: ReportInput) => {
  const { congressId, language } = input

  const { data: ownedCongress } = await supabase
    .from("congresses")
    .select("id")
    .eq("id", congressId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!ownedCongress) throw new Error("No autorizado")

  const { data: images } = await supabase
    .from("congress_images")
    .select("id")
    .eq("congress_id", congressId)
    .eq("user_id", user.id)

  const { data: ocrResults } = await supabase
    .from("ocr_results")
    .select("image_id, cleaned_text")
    .in("image_id", images?.map((img) => img.id) || [])

  const { data: references } = await supabase
    .from("reference_candidates")
    .select(`
      id,
      image_id, 
      detected_title, 
      detected_authors, 
      detected_year, 
      detected_journal, 
      verification_status, 
      detected_doi, 
      detected_pmid,
      official_title,
      abstract,
      citation_count
    `)
    .eq("congress_id", congressId)

  if (!ocrResults || ocrResults.length === 0) {
    throw new Error("No hay datos analizados. Analiza algunas fotos primero.")
  }

  // Construir contexto enriquecido para la IA
  const fullText = (images || [])
    .map((img, idx) => {
      const ocr = ocrResults.find((o) => o.image_id === img.id)?.cleaned_text
      if (!ocr) return null

      const imgRefs = (references || [])
        .filter((r) => r.image_id === img.id)
        .map((r) => {
          const row = r as { 
            id: string; 
            official_title?: string; 
            detected_title?: string; 
            verification_status?: string; 
            detected_doi?: string; 
            detected_pmid?: string;
            citation_count?: number;
            abstract?: string;
          }
          const status = row.verification_status?.toUpperCase() || "PENDING"
          const doi = row.detected_doi ? ` [DOI: ${row.detected_doi}]` : ""
          const pmid = row.detected_pmid ? ` [PMID: ${row.detected_pmid}]` : ""
          const citeInfo = row.citation_count ? ` [Citas: ${row.citation_count}]` : ""
          const academicContext = row.abstract 
            ? `\n   - EVIDENCIA REAL (Abstract): ${row.abstract.slice(0, 500)}...`
            : ""
          
          return `- [ref:${row.id.slice(0, 8)}] ${row.official_title || row.detected_title}. ${status}${doi}${pmid}${citeInfo}${academicContext}`
        })
        .join("\n")

      return `=== FOTO_${idx + 1} ===\nTEXTO DETECTADO EN DIAPOSITIVA:\n${ocr}\n${imgRefs ? `\nREFERENCIAS Y EVIDENCIA CIENTÍFICA ASOCIADA:\n${imgRefs}` : ""}`
    })
    .filter(Boolean)
    .join("\n\n---\n\n")
    .slice(0, 100_000)

  const { content, usage } = await generateReport({ fullText, language })
  if (!content) throw new Error("IA no generó contenido")

  await supabase.from("reports").insert({
    congress_id: congressId,
    user_id: user.id,
    title: `Esquema Académico (${language.toUpperCase()})`,
    content,
    report_type: "academic_outline",
  })

  await recordAiUsage({
    userId: user.id,
    actionType: "report_generation",
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    congressId,
    status: "success",
  })

  revalidatePath(`/dashboard/congresos/${congressId}`)
  revalidatePath(`/dashboard/congresos/${congressId}/resumen`)
  return { provider: usage.provider }
})
