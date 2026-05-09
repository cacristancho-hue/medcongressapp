"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkAiQuota, recordAiUsage } from "@/lib/ai-usage"
import { generateReport } from "@/lib/ai/router"

export async function generateAcademicReport(
  congressId: string,
  language: "es" | "en"
): Promise<{ success?: boolean; error?: string; provider?: string }> {
  if (process.env.MEDCONGRESS_AI_ENABLED !== "true") {
    return {
      error:
        "La IA esta desactivada. Activa MEDCONGRESS_AI_ENABLED=true para generar reportes.",
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const { data: ownedCongress } = await supabase
    .from("congresses")
    .select("id")
    .eq("id", congressId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!ownedCongress) return { error: "No autorizado" }

  const quota = await checkAiQuota(user.id, "report_generation")
  if (!quota.allowed) {
    await recordAiUsage({
      userId: user.id,
      actionType: "report_generation",
      model: "router-blocked",
      congressId,
      status: "blocked",
      errorMessage: quota.reason ?? "quota exceeded",
    })
    return { error: quota.reason ?? "Cuota excedida" }
  }

  try {
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
      return { error: "No hay datos analizados. Analiza algunas fotos primero." }
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
    return { success: true, provider: usage.provider }
  } catch (err) {
    console.error("Error generating polyglot report:", err)
    await recordAiUsage({
      userId: user.id,
      actionType: "report_generation",
      model: "router-error",
      congressId,
      status: "error",
      errorMessage: err instanceof Error ? err.message : "unknown",
    })
    return { error: "Fallo la generación del reporte" }
  }
}
