"use server"

import { createClient } from "@/lib/supabase/server"
import { OpenAI } from "openai"
import { revalidatePath } from "next/cache"
import { checkAiQuota, recordAiUsage } from "@/lib/ai-usage"

const MODEL = "gpt-4o"

export async function generateAcademicReport(
  congressId: string,
  language: "es" | "en"
): Promise<{ success?: boolean; error?: string }> {
  if (process.env.MEDCONGRESS_AI_ENABLED !== "true") {
    return {
      error:
        "La IA esta desactivada. Activa MEDCONGRESS_AI_ENABLED=true para generar reportes.",
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return { error: "OPENAI_API_KEY no configurada" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  // Verify ownership of the congress before doing anything expensive.
  const { data: ownedCongress } = await supabase
    .from("congresses")
    .select("id")
    .eq("id", congressId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!ownedCongress) return { error: "No autorizado" }

  // Cost guard.
  const quota = await checkAiQuota(user.id, "report_generation")
  if (!quota.allowed) {
    await recordAiUsage({
      userId: user.id,
      actionType: "report_generation",
      model: MODEL,
      congressId,
      status: "blocked",
      errorMessage: quota.reason ?? "quota exceeded",
    })
    return { error: quota.reason ?? "Cuota excedida" }
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `Eres un experto en comunicación científica médica.
          Tu objetivo es transformar datos de OCR en un **Esquema Estructurado para Presentación Académica**.

          IMPORTANTE: El reporte debe estar redactado COMPLETAMENTE en ${language === "es" ? "Español" : "Inglés"}.

          ESTRUCTURA (Markdown):
          # [Título del Congreso]
          ## Diapositiva 1: Introducción y Objetivos
          ## Diapositivas 2-N: Hallazgos por Eje Temático (Citar evidencia técnica)
          ## Diapositiva Final: Conclusiones y Perlas Clínicas (Take-home messages)
          ## Bibliografía de Apoyo`,
        },
        {
          role: "user",
          content: `Genera el esquema basado en estos datos:\n\n\`\`\`\n${fullText}\n\`\`\``,
        },
      ],
    })

    const content = response.choices[0].message.content
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
      model: MODEL,
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
      congressId,
      status: "success",
    })

    revalidatePath(`/dashboard/congresos/${congressId}`)
    return { success: true }
  } catch (err) {
    console.error("Error generating polyglot report:", err)
    await recordAiUsage({
      userId: user.id,
      actionType: "report_generation",
      model: MODEL,
      congressId,
      status: "error",
      errorMessage: err instanceof Error ? err.message : "unknown",
    })
    return { error: "Fallo la generación del reporte" }
  }
}
