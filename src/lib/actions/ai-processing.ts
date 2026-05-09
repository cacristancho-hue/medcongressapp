"use server"

import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"
import { revalidatePath } from "next/cache"
import { checkAiQuota, recordAiUsage } from "@/lib/ai-usage"

function isAiEnabled() {
  return process.env.MEDCONGRESS_AI_ENABLED === "true"
}

const MODEL = "gpt-4o"

const SYSTEM_PROMPT = `
Eres un asistente médico experto de alto nivel, capaz de analizar información de CUALQUIER especialidad médica (Cardiología, Oncología, Pediatría, Cirugía, etc.).
Tu tarea es realizar un análisis estructurado y un OCR visual de diapositivas, posters o material gráfico de congresos médicos.

REGLAS CRÍTICAS:
1. IDENTIFICACIÓN: Determina la especialidad médica predominante en la imagen.
2. OCR: Extrae TODO el texto legible de forma literal en 'raw_text'. Prioriza títulos, datos numéricos y conclusiones.
3. RESUMEN MÉDICO: Genera un 'medical_summary' conciso y profesional. Debe incluir:
   - Objetivo del estudio o tema expuesto.
   - Datos clave: resultados, estadísticas (p-values, IC, promedios), dosis o criterios diagnósticos mencionados.
   - Conclusión clínica principal.
4. TOPICS: Identifica hasta 5 temas clave usando terminología médica técnica.
5. REFERENCIAS: Detecta citas bibliográficas, nombres de estudios (ej. "EMPA-REG", "KEYNOTE-001") o menciones a journals.

OUTPUT FORMAT (JSON estricto):
{
  "specialty": "Especialidad detectada",
  "raw_text": "texto literal...",
  "medical_summary": "Resumen profesional...",
  "topics": ["Tema 1", "Tema 2"],
  "references": [
    {
      "detected_title": "Título del estudio o nombre del ensayo",
      "detected_authors": "Autores mencionados",
      "detected_year": "Año",
      "detected_journal": "Journal o Fuente",
      "detected_doi": "DOI si es visible"
    }
  ]
}
`

interface AIReference {
  detected_title?: string
  detected_authors?: string
  detected_year?: string
  detected_journal?: string
  detected_doi?: string
}

export async function processImageWithAI(imageId: string) {
  if (!isAiEnabled()) {
    return { skipped: true, reason: "AI processing is disabled" }
  }

  if (!process.env.OPENAI_API_KEY) {
    return { error: "OPENAI_API_KEY no configurada" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  // Ownership check (closes audit gap on the canonical pipeline).
  const { data: image, error: imgError } = await supabase
    .from("congress_images")
    .select("id, user_id, congress_id, storage_path, storage_path_optimized")
    .eq("id", imageId)
    .eq("user_id", user.id)
    .single()

  if (imgError || !image) {
    return { error: "Imagen no encontrada o no autorizada" }
  }

  // Cost guard: monthly quota & cost cap.
  const quota = await checkAiQuota(user.id, "image_analysis")
  if (!quota.allowed) {
    await recordAiUsage({
      userId: user.id,
      actionType: "image_analysis",
      model: MODEL,
      congressId: image.congress_id,
      imageId,
      status: "blocked",
      errorMessage: quota.reason ?? "quota exceeded",
    })
    return { error: quota.reason ?? "Cuota excedida" }
  }

  await supabase
    .from("congress_images")
    .update({ ai_status: "ai_pending", ocr_status: "ocr_pending" })
    .eq("id", imageId)

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("congress-photos")
      .createSignedUrl(image.storage_path_optimized || image.storage_path, 300)

    if (urlError || !signedUrlData?.signedUrl) {
      throw new Error("No se pudo generar el acceso temporal para la IA")
    }

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Analiza esta imagen de congreso médico:" },
            {
              type: "image_url",
              image_url: { url: signedUrlData.signedUrl, detail: "high" },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    })

    const result = JSON.parse(response.choices[0].message.content || "{}")

    const { error: ocrErr } = await supabase.from("ocr_results").insert({
      image_id: imageId,
      raw_text: result.raw_text,
      cleaned_text: result.medical_summary,
    })
    if (ocrErr) throw ocrErr

    if (result.references?.length > 0) {
      const refEntries = result.references.map((r: AIReference) => ({
        congress_id: image.congress_id,
        image_id: imageId,
        user_id: image.user_id,
        raw_reference_text: `${r.detected_title ?? ""} ${r.detected_authors ?? ""} ${r.detected_journal ?? ""}`.trim(),
        detected_title: r.detected_title,
        detected_authors: r.detected_authors,
        detected_year: r.detected_year,
        detected_journal: r.detected_journal,
        detected_doi: r.detected_doi,
        verification_status: "not_verified",
      }))

      await supabase.from("reference_candidates").insert(refEntries)
    }

    await supabase
      .from("congress_images")
      .update({
        ai_status: "ai_done",
        ocr_status: "ocr_done",
        status: "ocr_done",
      })
      .eq("id", imageId)

    await recordAiUsage({
      userId: user.id,
      actionType: "image_analysis",
      model: MODEL,
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
      congressId: image.congress_id,
      imageId,
      status: "success",
    })

    revalidatePath(`/dashboard/congresos/${image.congress_id}`)
    return { success: true, data: result }
  } catch (error: unknown) {
    console.error("AI Processing Error:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido en el procesamiento"

    await supabase
      .from("congress_images")
      .update({ ai_status: "ai_failed", ocr_status: "ocr_failed" })
      .eq("id", imageId)

    await recordAiUsage({
      userId: user.id,
      actionType: "image_analysis",
      model: MODEL,
      congressId: image.congress_id,
      imageId,
      status: "error",
      errorMessage,
    })

    return { error: errorMessage }
  }
}
