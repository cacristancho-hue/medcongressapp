"use server"

import { revalidatePath } from "next/cache"
import { recordAiUsage } from "@/lib/ai-usage"
import { analyzeImage, extractTopicsFromCorpus } from "@/lib/ai/router"
import { withAction } from "@/lib/with-action"
import { verifyReference } from "@/lib/reference-verification"
import { execSync } from "child_process"
import path from "path"
import fs from "fs"
import os from "os"

interface AIReference {
  detected_title?: string | null
  detected_authors?: string | null
  detected_year?: string | null
  detected_journal?: string | null
  detected_doi?: string | null
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

  // --- FASE 1: OPTIMIZACIÓN Y RECTIFICACIÓN (PERSISTENTE) ---
  let finalAnalysisUrl: string | null = null
  let leftBuffer: Buffer | undefined
  let rightBuffer: Buffer | undefined
  let originalSignedUrl: string | null = null

  try {
    // Siempre partimos de la original para evitar degradación acumulativa
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("congress-photos")
      .createSignedUrl(image.storage_path, 300)

    if (urlError || !signedUrlData?.signedUrl) {
      throw new Error("No se pudo generar el acceso temporal para la optimización")
    }
    originalSignedUrl = signedUrlData.signedUrl

    const inputPath = path.join(os.tmpdir(), `input_sa_${imageId}.jpg`)
    const outputPath = path.join(os.tmpdir(), `optimized_sa_${imageId}.jpg`)

    const response = await fetch(originalSignedUrl)
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(inputPath, buffer)

    const optimizeScript = path.join(process.cwd(), "tools", "optimize_slide.py")
    const pythonPath = process.env.PYTHON_PATH || "python"

    // VERCEL DETECTION: Skip OpenCV if running in Vercel/Cloud as it lacks Python/OpenCV
    const isCloud = process.env.VERCEL === "1" || process.env.NODE_ENV === "production"

    if (isCloud) {
      console.log(`[ai-processing] Cloud environment detected, skipping OpenCV for ${imageId}`)
      finalAnalysisUrl = originalSignedUrl
    } else {
      try {
        // Ejecución del motor de visión (OpenCV) localmente
        execSync(`${pythonPath} "${optimizeScript}" "${inputPath}" "${outputPath}"`)
        // ... rest of local logic ...
      } catch (e) {
        finalAnalysisUrl = originalSignedUrl
      }
    }
  } catch (phase1Err) {
    console.error("[processImageWithAI] Fallo crítico en Fase 1:", phase1Err)
    throw new Error("No se pudo preparar la imagen para el análisis.")
  }

  // --- FASE 2: ANÁLISIS IA (UBICUO Y AGRESIVO) ---
  try {
    const { data: result, usage } = await analyzeImage({
      imageUrl: finalAnalysisUrl!,
      zoomLeftUrl: leftBuffer ? `data:image/jpeg;base64,${leftBuffer.toString('base64')}` : undefined,
      zoomRightUrl: rightBuffer ? `data:image/jpeg;base64,${rightBuffer.toString('base64')}` : undefined,
    })

    // Auditoría Heurística (Safety Net)
    if ((!result.references || result.references.length === 0) && 
        /(\d{4}|et al|doi:|j\. |clin\.|med\.|lancet|nejm)/i.test(result.raw_text)) {
      console.log(`[ai-auditor] Posible cita omitida detectada en texto bruto de imagen ${imageId}`)
    }

    await supabase
      .from("ocr_results")
      .upsert({
        image_id: imageId,
        // raw_text = literal OCR; cleaned_text mirrors it until a real cleanup
        // stage exists. medical_summary holds the AI inference, kept separate
        // so downstream never confuses "extracted" with "inferred".
        raw_text: result.raw_text,
        cleaned_text: result.raw_text,
        medical_summary: result.medical_summary,
      }, { onConflict: "image_id" })

    // Procesar Tópicos
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
            .upsert({
              congress_id: image.congress_id,
              name: topic.name,
              category: topic.category ?? null,
              description: topic.description ?? null,
            }, { onConflict: "congress_id,name" })
            .select("id")
            .single()
          topicId = created?.id
        }

        if (topicId) {
          await supabase
            .from("image_topics")
            .upsert({ image_id: imageId, topic_id: topicId }, { onConflict: "image_id,topic_id" })
        }
      }
    }

    // Procesar Referencias
    if (result.references?.length > 0) {
      const { data: previousRefs } = await supabase
        .from("reference_candidates")
        .select("id")
        .eq("image_id", imageId)

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
      
      const { data: insertedRefs } = await supabase.from("reference_candidates").insert(refEntries).select()

      if (insertedRefs) {
        if (previousRefs?.length) {
          await supabase
            .from("reference_candidates")
            .delete()
            .in("id", previousRefs.map((ref) => ref.id))
        }

        for (const ref of insertedRefs) {
          try {
            const vResult = await verifyReference({
              id: ref.id,
              raw_text: ref.raw_reference_text,
              detected_title: ref.detected_title,
              detected_authors: ref.detected_authors,
              detected_year: ref.detected_year,
              detected_journal: ref.detected_journal,
              detected_doi: ref.detected_doi,
            })
            
            await supabase.from("reference_candidates").update({
              verification_status: vResult.status,
              confidence_score: vResult.confidenceScore,
              detected_doi: vResult.matchedDoi ?? ref.detected_doi,
              detected_pmid: vResult.matchedPmid,
              verification_source: vResult.source,
              official_title: vResult.matchedTitle,
              official_authors: vResult.matchedAuthors,
              official_year: vResult.matchedYear,
              official_journal: vResult.matchedJournal,
              abstract: vResult.abstract,
              publication_type: vResult.publicationType,
            }).eq("id", ref.id)
          } catch (e) {
            console.warn("[processImageWithAI] Fallo auto-verificación:", ref.id, e)
          }
        }
      }
    }

    await supabase
      .from("congress_images")
      .update({ ai_status: "ai_done", ocr_status: "ocr_done", status: "ocr_done" })
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
    revalidatePath("/dashboard/biblioteca")
    return { data: result, provider: usage.provider, success: true }

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
    .select("id, ocr_results(raw_text, cleaned_text)")
    .eq("congress_id", congressId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (fetchErr) throw new Error("No se pudieron cargar las fotos analizadas.")

  // Topics must come from literal OCR (raw_text), not the AI summary, to avoid
  // inference-on-inference. Fall back to cleaned_text for legacy rows.
  type Row = { id: string; ocr_results: Array<{ raw_text: string | null; cleaned_text: string | null }> | null }
  const documents = ((rows ?? []) as Row[])
    .map((r, idx) => ({
      index: idx,
      imageId: r.id,
      text: r.ocr_results?.[0]?.raw_text ?? r.ocr_results?.[0]?.cleaned_text ?? "",
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
