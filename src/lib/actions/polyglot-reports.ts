"use server"

import { createClient } from "@/lib/supabase/server"
import { OpenAI } from "openai"
import { revalidatePath } from "next/cache"

export async function generateAcademicReport(
  congressId: string,
  language: "es" | "en"
): Promise<{ success?: boolean; error?: string }> {
  if (process.env.MEDCONGRESS_AI_ENABLED !== "true") {
    return { error: "La IA esta desactivada. Activa MEDCONGRESS_AI_ENABLED=true para generar reportes." }
  }

  if (!process.env.OPENAI_API_KEY) {
    return { error: "OPENAI_API_KEY no configurada" }
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  try {
    // 1. Obtener todos los textos de OCR del congreso
    const { data: images } = await supabase
      .from("congress_images")
      .select("id")
      .eq("congress_id", congressId)
      .eq("user_id", user.id)

    const { data: ocrData } = await supabase
      .from("ocr_results")
      .select("cleaned_text")
      .in("image_id", images?.map(img => img.id) || [])

    if (!ocrData || ocrData.length === 0) {
      return { error: "No hay datos analizados. Analiza algunas fotos primero." }
    }

    const fullText = ocrData
      .map(d => d.cleaned_text)
      .filter(Boolean)
      .join("\n\n---\n\n")
      .slice(0, 100_000)

    // 2. Llamada a OpenAI para síntesis políglota
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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

    // 3. Guardar el reporte
    await supabase.from("reports").insert({
      congress_id: congressId,
      user_id: user.id,
      title: `Esquema Académico (${language.toUpperCase()})`,
      content: content,
      report_type: "academic_outline",
    })

    revalidatePath(`/dashboard/congresos/${congressId}`)
    return { success: true }
  } catch (err) {
    console.error("Error generating polyglot report:", err)
    return { error: "Fallo la generación del reporte" }
  }
}
