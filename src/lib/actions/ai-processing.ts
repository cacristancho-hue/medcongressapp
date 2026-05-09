"use server"

import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"
import { revalidatePath } from "next/cache"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
  const supabase = await createClient()

  // 1. Obtener datos de la imagen
  const { data: image, error: imgError } = await supabase
    .from("congress_images")
    .select("*")
    .eq("id", imageId)
    .single()

  if (imgError || !image) {
    return { error: "Imagen no encontrada" }
  }

  // Marcar como procesando
  await supabase
    .from("congress_images")
    .update({ ai_status: "ai_pending", ocr_status: "ocr_pending" })
    .eq("id", imageId)

  try {
    // 2. Generar URL firmada (Pase temporal de 5 minutos)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("congress-photos")
      .createSignedUrl(image.storage_path_optimized || image.storage_path, 300)

    if (urlError || !signedUrlData?.signedUrl) {
      throw new Error("No se pudo generar el acceso temporal para la IA")
    }

    // 3. Llamar a OpenAI (GPT-4o) usando la URL firmada
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Analiza esta imagen de congreso médico:" },
            {
              type: "image_url",
              image_url: {
                url: signedUrlData.signedUrl,
                detail: "high"
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    })

    const result = JSON.parse(response.choices[0].message.content || "{}")

    // 4. Guardar resultados
    // Guardar OCR
    const { error: ocrErr } = await supabase.from("ocr_results").insert({
      image_id: imageId,
      raw_text: result.raw_text,
      cleaned_text: result.medical_summary, // Usamos el resumen como versión "limpia" inicial
    })

    if (ocrErr) throw ocrErr

    // Guardar Referencias Candidatas
    if (result.references?.length > 0) {
      const refEntries = result.references.map((r: AIReference) => ({
        congress_id: image.congress_id,
        image_id: imageId,
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

    // Actualizar estados finales en congress_images
    await supabase
      .from("congress_images")
      .update({
        ai_status: "ai_done",
        ocr_status: "ocr_done",
        status: "ocr_done",
      })
      .eq("id", imageId)

    revalidatePath(`/dashboard/congresos/${image.congress_id}`)
    return { success: true, data: result }

  } catch (error: unknown) {
    console.error("AI Processing Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido en el procesamiento"
    
    await supabase
      .from("congress_images")
      .update({
        ai_status: "ai_failed",
        ocr_status: "ocr_failed",
      })
      .eq("id", imageId)

    return { error: errorMessage }
  }
}
