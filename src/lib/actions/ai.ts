"use server"

import { createClient } from "@/lib/supabase/server"
import { OpenAI } from "openai"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Esquema de validación para la respuesta de la IA
const AnalysisSchema = z.object({
  extracted_text: z.string().describe("El texto completo y limpio extraído de la diapositiva."),
  main_topics: z.array(z.object({
    name: z.string(),
    category: z.string(),
    description: z.string(),
  })).describe("Temas académicos clave identificados en la imagen."),
  bibliographic_references: z.array(z.object({
    raw_text: z.string(),
    title: z.string().optional(),
    authors: z.string().optional(),
    year: z.string().optional(),
    journal: z.string().optional(),
    doi: z.string().optional(),
  })).describe("Referencias a estudios, guías o artículos citados en la diapositiva."),
})
export async function analyzeImage(
  imageId: string,
  congressId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  // Verify ownership and derive the signed URL server-side to prevent credit draining.
  const { data: image } = await supabase
    .from("congress_images")
    .select("user_id, congress_id, storage_path")
    .eq("id", imageId)
    .eq("congress_id", congressId)
    .eq("user_id", user.id)
    .single()

  if (!image) {
    return { error: "No autorizado o imagen no encontrada" }
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("congress-photos")
    .createSignedUrl(image.storage_path, 600)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return { error: "No se pudo preparar la imagen para análisis" }
  }

  try {
// ...
    // 1. Marcar imagen como procesando
    await supabase
      .from("congress_images")
      .update({ status: "processing" })
      .eq("id", imageId)

    // 2. Llamada a OpenAI Vision para análisis multimodal
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Eres un experto en análisis de contenido médico académico. 
          Tu tarea es extraer texto, identificar temas y detectar referencias bibliográficas de diapositivas de congresos médicos.
          Responde SIEMPRE en formato JSON estructurado según el esquema solicitado.
          Idioma: Español preferiblemente para temas, idioma original para referencias.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analiza esta diapositiva médica y extrae toda la información académica relevante." },
            {
              type: "image_url",
              image_url: { url: signedUrlData.signedUrl },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    })

    const rawResult = JSON.parse(response.choices[0].message.content || "{}")
    const validatedResult = AnalysisSchema.parse(rawResult)

    // 3. Persistir OCR
    await supabase.from("ocr_results").upsert({
      image_id: imageId,
      raw_text: validatedResult.extracted_text,
      cleaned_text: validatedResult.extracted_text,
      confidence_score: 0.95,
    })

    // 4. Persistir Tópicos y Relaciones
    for (const topic of validatedResult.main_topics) {
      // Buscar o crear tópico
      const { data: existingTopic } = await supabase
        .from("topics")
        .select("id")
        .eq("congress_id", congressId)
        .eq("name", topic.name)
        .single()

      let topicId = existingTopic?.id

      if (!topicId) {
        const { data: newTopic } = await supabase
          .from("topics")
          .insert({
            congress_id: congressId,
            name: topic.name,
            category: topic.category,
            description: topic.description,
          })
          .select()
          .single()
        topicId = newTopic?.id
      }

      if (topicId) {
        await supabase.from("image_topics").upsert({
          image_id: imageId,
          topic_id: topicId,
        })
      }
    }

    // 5. Persistir Referencias
    if (validatedResult.bibliographic_references.length > 0) {
      await supabase.from("references").insert(
        validatedResult.bibliographic_references.map((ref) => ({
          congress_id: congressId,
          image_id: imageId,
          raw_text: ref.raw_text,
          detected_title: ref.title,
          detected_authors: ref.authors,
          detected_year: ref.year,
          detected_journal: ref.journal,
          detected_doi: ref.doi,
          verification_status: "not_verified",
          verification_source: "openalex",
        }))
      )
    }

    // 6. Finalizar estado
    await supabase
      .from("congress_images")
      .update({ status: "analyzed" })
      .eq("id", imageId)

    revalidatePath(`/dashboard/congresos/${congressId}`)
    return { success: true }
  } catch (err) {
    console.error("Error en análisis IA:", err)
    await supabase
      .from("congress_images")
      .update({ status: "failed" })
      .eq("id", imageId)
    return { error: "Fallo el análisis de IA" }
  }
}

export async function getImageAnalysis(imageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ocr: null, topics: [], references: [], specialty: null }
  }

  const { data: image } = await supabase
    .from("congress_images")
    .select("id")
    .eq("id", imageId)
    .eq("user_id", user.id)
    .single()

  if (!image) {
    return { ocr: null, topics: [], references: [], specialty: null }
  }

  const [ocrResponse, topicsResponse, referencesResponse, legacyTopicsResponse] = await Promise.all([
    supabase.from("ocr_results").select("cleaned_text").eq("image_id", imageId).single(),
    supabase.from("topics").select("name, category").eq("id", imageId), // En Fase 6, topics podría estar vinculado directo o vía image_id
    supabase.from("reference_candidates").select("raw_reference_text, detected_title, detected_authors, detected_year, detected_journal, verification_status, confidence_score").eq("image_id", imageId),
    supabase.from("image_topics").select("topics(name, category)").eq("image_id", imageId),
  ])

  // Combinar tópicos de ambas estructuras (legacy y nueva)
  const topics = [
    ...(topicsResponse.data || []),
    ...(legacyTopicsResponse.data?.map(t => t.topics).filter(Boolean) || [])
  ]

  // Normalizar referencias
  const references = referencesResponse.data?.map(ref => ({
    raw_text: ref.raw_reference_text,
    detected_title: ref.detected_title,
    detected_authors: ref.detected_authors,
    detected_year: ref.detected_year,
    detected_journal: ref.detected_journal,
    verification_status: ref.verification_status,
    confidence_score: ref.confidence_score
  })) || []

  return {
    ocr: ocrResponse.data?.cleaned_text || null,
    topics,
    references,
  }
}

  export async function generateCongressReport(congressId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  try {
  const { data: congress } = await supabase
    .from("congresses")
    .select("id")
    .eq("id", congressId)
    .eq("user_id", user.id)
    .single()

  if (!congress) return { error: "No autorizado" }

  // 1. Obtener todos los textos de OCR del congreso
  const { data: congressImages } = await supabase
    .from("congress_images")
    .select("id")
    .eq("congress_id", congressId)
    .eq("user_id", user.id)

  const { data: ocrData } = await supabase
    .from("ocr_results")
    .select("cleaned_text")
    .in("image_id", congressImages?.map(img => img.id) || [])

  if (!ocrData || ocrData.length === 0) {
    return { error: "No hay datos analizados para generar un reporte. Analiza algunas fotos primero." }
  }

  const fullText = ocrData
    .map(d => d.cleaned_text)
    .filter(Boolean)
    .join("\n\n---\n\n")
    .slice(0, 120_000)

  // 2. Llamada a OpenAI para síntesis académica estructurada
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Eres un experto en comunicación científica y redacción médica académica. 
        Tu objetivo es transformar datos de OCR de un congreso en un **Esquema Estructurado para Presentación Académica**.

        ESTRUCTURA REQUERIDA (Markdown):
        # [Título del Congreso/Reporte]
        *Nota: Síntesis académica para uso docente/clínico.*

        ## Diapositiva 1: Introducción y Objetivos
        - Contexto del área médica discutida.
        - Objetivos principales de las ponencias analizadas.

        ## Diapositiva 2-N: Hallazgos por Eje Temático
        (Organiza el contenido en temas lógicos, ej: Inmunoterapia, Nuevos Biomarcadores, etc.)
        - **Punto Clave:** Descripción técnica.
        - **Evidencia:** Citar estudios o datos numéricos (p-values, HR, N).

        ## Diapositiva Final: Conclusiones y Perlas Clínicas
        - Resumen de cambios en la práctica clínica sugeridos.
        - Mensajes para llevar a casa (Take-home messages).

        ## Bibliografía de Apoyo
        - Lista de las referencias más relevantes detectadas.

        REGLAS:
        - Usa un tono profesional, técnico y preciso.
        - NO alucines datos; si algo no está claro en el OCR, no lo incluyas.
        - Idioma: Español.`,
      },
      {
        role: "user",
        content: `Genera el esquema de presentación basado en estos datos del congreso:\n\n\`\`\`\n${fullText}\n\`\`\``,
      },
    ],
  })

  const reportContent = response.choices[0].message.content

  if (!reportContent) throw new Error("IA no generó contenido")

  // 3. Guardar el reporte
  await supabase.from("reports").insert({
    congress_id: congressId,
    user_id: user.id,
    title: "Esquema de Presentación Académica (IA)",
    content: reportContent,
    report_type: "academic_outline",
  })

  revalidatePath(`/dashboard/congresos/${congressId}`)
  return { success: true }
  } catch (err) {
  console.error("Error generando reporte:", err)
  return { error: "Fallo la generación del reporte" }
  }
  }
