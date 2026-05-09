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

  const { data: ocrData } = await supabase
    .from("ocr_results")
    .select("cleaned_text")
    .in("image_id", images?.map((img) => img.id) || [])

  if (!ocrData || ocrData.length === 0) {
    throw new Error("No hay datos analizados. Analiza algunas fotos primero.")
  }

  const fullText = ocrData
    .map((d) => d.cleaned_text)
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
