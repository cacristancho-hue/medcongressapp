"use server"

import { revalidatePath } from "next/cache"
import { recordAiUsage } from "@/lib/ai-usage"
import { analyzeImage, extractTopicsFromCorpus } from "@/lib/ai/router"
import { withAction } from "@/lib/with-action"

interface AIReference {
  detected_title?: string
  detected_authors?: string
  detected_year?: string
  detected_journal?: string
  detected_doi?: string
}

// =============================================================================
// processImageWithAI — vision OCR + structured extraction for one image
// =============================================================================

export const processImageWithAI = withAction({
  name: "ai.image_analysis",
  rateLimit: "image_analysis",
  quota: "image_analysis",
  requiresAi: true,
})(async ({ user, supabase }, imageId: string) => {
  // Ownership gate.
  const { data: image, error: imgError } = await supabase
    .from("congress_images")
    .select("id, user_id, congress_id, storage_path, storage_path_optimized")
    .eq("id", imageId)
    .eq("user_id", user.id)
    .single()

  if (imgError || !image) {
    throw new Error("Imagen no encontrada o no autorizada")
  }

  await supabase
    .from("congress_images")
    .update({ ai_status: "ai_pending", ocr_status: "ocr_pending" })
    .eq("id", imageId)

  try {
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("congress-photos")
      .createSignedUrl(image.storage_path_optimized || image.storage_path, 300)

    if (urlError || !signedUrlData?.signedUrl) {
      throw new Error("No se pudo generar el acceso temporal para la IA")
    }

    const { data: result, usage } = await analyzeImage({
      imageUrl: signedUrlData.signedUrl,
    })

    const { error: ocrErr } = await supabase.from("ocr_results").insert({
      image_id: imageId,
      raw_text: result.raw_text,
      cleaned_text: result.medical_summary,
    })
    if (ocrErr) throw ocrErr

    if (result.topics?.length > 0) {
      for (const topic of result.topics) {
        if (!topic.name?.trim()) continue
        const { data: existing } = await supabase
          .from("topics")
          .select("id")
          .eq("congress_id", image.congress_id)
          .eq("name", topic.name)
          .maybeSingle()

        let topicId = existing?.id
        if (!topicId) {
          const { data: created } = await supabase
            .from("topics")
            .insert({
              congress_id: image.congress_id,
              name: topic.name,
              category: topic.category ?? null,
              description: topic.description ?? null,
            })
            .select("id")
            .single()
          topicId = created?.id
        }

        if (topicId) {
          await supabase
            .from("image_topics")
            .upsert(
              { image_id: imageId, topic_id: topicId },
              { onConflict: "image_id,topic_id" }
            )
        }
      }
    }

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
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      congressId: image.congress_id,
      imageId,
      status: "success",
    })

    revalidatePath(`/dashboard/congresos/${image.congress_id}`)
    return { data: result, provider: usage.provider }
  } catch (error: unknown) {
    await supabase
      .from("congress_images")
      .update({ ai_status: "ai_failed", ocr_status: "ocr_failed" })
      .eq("id", imageId)

    await recordAiUsage({
      userId: user.id,
      actionType: "image_analysis",
      model: "router-error",
      congressId: image.congress_id,
      imageId,
      status: "error",
      errorMessage: error instanceof Error ? error.message : "unknown",
    })

    throw error
  }
})

// =============================================================================
// extractCongressTopics — re-extract topics from existing OCR corpus (1 LLM call)
// =============================================================================

export const extractCongressTopics = withAction({
  name: "ai.topics_extraction",
  rateLimit: "image_analysis",
  quota: "image_analysis",
  requiresAi: true,
})(async ({ user, supabase }, congressId: string) => {
  const { data: ownedCongress } = await supabase
    .from("congresses")
    .select("id")
    .eq("id", congressId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!ownedCongress) throw new Error("No autorizado")

  const { data: rows, error: fetchErr } = await supabase
    .from("congress_images")
    .select("id, ocr_results(cleaned_text)")
    .eq("congress_id", congressId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (fetchErr) throw new Error("No se pudieron cargar las fotos analizadas.")

  type Row = { id: string; ocr_results: Array<{ cleaned_text: string | null }> | null }
  const documents = ((rows ?? []) as Row[])
    .map((r, idx) => ({
      index: idx,
      imageId: r.id,
      text: r.ocr_results?.[0]?.cleaned_text ?? "",
    }))
    .filter((d) => d.text.trim().length > 0)

  if (documents.length === 0) throw new Error("No hay OCR previo para extraer tópicos.")

  const { topics, usage } = await extractTopicsFromCorpus({
    documents: documents.map(({ index, text }) => ({ index, text })),
  })

  let topicsCreated = 0
  let linksCreated = 0

  for (const t of topics) {
    if (!t.name?.trim()) continue

    const { data: existing } = await supabase
      .from("topics")
      .select("id")
      .eq("congress_id", congressId)
      .eq("name", t.name)
      .maybeSingle()

    let topicId = existing?.id
    if (!topicId) {
      const { data: created } = await supabase
        .from("topics")
        .insert({
          congress_id: congressId,
          name: t.name,
          category: t.category ?? null,
          description: t.description ?? null,
        })
        .select("id")
        .single()
      topicId = created?.id
      if (topicId) topicsCreated++
    }

    if (!topicId) continue

    for (const idx of t.image_indices ?? []) {
      const doc = documents[idx]
      if (!doc) continue
      const { error: linkErr } = await supabase
        .from("image_topics")
        .upsert(
          { image_id: doc.imageId, topic_id: topicId },
          { onConflict: "image_id,topic_id" }
        )
      if (!linkErr) linksCreated++
    }
  }

  await recordAiUsage({
    userId: user.id,
    actionType: "image_analysis",
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    congressId,
    status: "success",
  })

  revalidatePath(`/dashboard/congresos/${congressId}`)
  revalidatePath(`/dashboard/congresos/${congressId}/resumen`)
  return { topicsCreated, linksCreated }
})
