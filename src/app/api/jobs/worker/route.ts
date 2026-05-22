// Cron-triggered worker that processes a small batch of ai_jobs per invocation.
// Authentication: Bearer token = CRON_SECRET (must match env var).
// Vercel Cron should hit this endpoint frequently enough to avoid long queues.
//
// Why a small batch:
// 1. Keeps each invocation within the 60s function budget.
// 2. Each call is an independent transaction.
// 3. A small batch reduces the "wait until next cron" experience without overloading the function.

import { createServiceClient } from "@/lib/supabase/service"
import { analyzeImage, extractTopicsFromCorpus } from "@/lib/ai/router"
import { recordAiUsage } from "@/lib/ai-usage"
import { verifyReference } from "@/lib/reference-verification"
import { enqueueReferenceVerificationIfPending } from "@/lib/jobs"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { renderPreparedDerivative, extractFooterZooms } from "@/lib/server-image"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // 60s max for image vision processing
const MAX_JOBS_PER_RUN = 4
const STALE_PROCESSING_MINUTES = 20

// =============================================================================
// TYPES & LOGGING
// =============================================================================

type LogLevel = "info" | "warn" | "error"

function log(level: LogLevel, msg: string, data?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...data,
  }
  console.log(JSON.stringify(entry))
}

async function writeJobResult(
  supabase: SupabaseClient,
  jobId: string,
  result: Record<string, unknown>
) {
  await supabase
    .from("ai_jobs")
    .update({ result, updated_at: new Date().toISOString() })
    .eq("id", jobId)
}

interface AiJobRow {
  id: string
  job_type: "image_analysis" | "image_derivation" | "report_generation" | "topics_extraction" | "reference_verification"
  status: "pending" | "processing" | "succeeded" | "failed"
  payload: Record<string, unknown>
  result?: Record<string, unknown> | null
  user_id: string
  congress_id?: string
  image_id?: string
}

// =============================================================================
// WORKER HANDLERS
// =============================================================================

import { SupabaseClient } from "@supabase/supabase-js"

async function runImageAnalysis(supabase: SupabaseClient, job: AiJobRow) {
  if (!job.image_id) throw new Error("image_id requerido")

  await writeJobResult(supabase, job.id, {
    stage: "init",
    kind: "image_analysis",
    congressId: job.congress_id,
    imageId: job.image_id,
  })

  const { data: image, error: imgErr } = await supabase
    .from("congress_images")
    .select("id, user_id, congress_id, storage_path, storage_path_optimized")
    .eq("id", job.image_id)
    .single()

  if (imgErr || !image) throw new Error(`Imagen no encontrada: ${imgErr?.message}`)

  log("info", "starting robust image analysis", { imageId: job.image_id })
  await writeJobResult(supabase, job.id, {
    stage: "image_loaded",
    kind: "image_analysis",
    congressId: job.congress_id,
    imageId: job.image_id,
  })

  // --- FASE 1: OPTIMIZACIÓN Y RECTIFICACIÓN ---
  let finalAnalysisUrl: string | null = null
  let leftBuffer: Buffer | undefined
  let rightBuffer: Buffer | undefined

  try {
    let sourceBuffer: Buffer

    if (image.storage_path_optimized) {
      const { data: optimizedSigned } = await supabase.storage
        .from("congress-photos")
        .createSignedUrl(image.storage_path_optimized, 900)

      if (!optimizedSigned?.signedUrl) throw new Error("No pudo firmarse la URL de la imagen optimizada")

      const response = await fetch(optimizedSigned.signedUrl)
      sourceBuffer = Buffer.from(await response.arrayBuffer())
    } else {
      const { data: signed } = await supabase.storage
        .from("congress-photos")
        .createSignedUrl(image.storage_path, 900)

      if (!signed?.signedUrl) throw new Error("No pudo firmarse la URL de la imagen original")

      const response = await fetch(signed.signedUrl)
      sourceBuffer = Buffer.from(await response.arrayBuffer())
    }

    const optimizedResult = await renderPreparedDerivative(sourceBuffer, 3072, 3072, "jpeg", 90)
    const previewResult = await renderPreparedDerivative(sourceBuffer, 1200, 1200, "jpeg", 88)
    const optimizedBuffer = optimizedResult.data
    const optimizedInfo = optimizedResult.info
    const previewBuffer = previewResult.data
    const rectifiedPath = image.storage_path.replace(/\.[^.]+$/, "") + "_rectified.jpg"

    const zooms = await extractFooterZooms(optimizedBuffer)
    leftBuffer = zooms.left
    rightBuffer = zooms.right

    const { error: uploadErr } = await supabase.storage
      .from("congress-photos")
      .upload(rectifiedPath, optimizedBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      })
    if (uploadErr) throw new Error(`No se pudo guardar la versión optimizada: ${uploadErr.message}`)

    const { error: updateErr } = await supabase
      .from("congress_images")
      .update({
        storage_path_optimized: rectifiedPath,
        upload_status: "compressed",
        width_optimized: optimizedInfo.width ?? null,
        height_optimized: optimizedInfo.height ?? null,
        mime_type_optimized: "image/jpeg",
      })
      .eq("id", job.image_id)
    if (updateErr) throw new Error(`No se pudo actualizar el registro de imagen: ${updateErr.message}`)

    finalAnalysisUrl = `data:image/jpeg;base64,${previewBuffer.toString("base64")}`
    await writeJobResult(supabase, job.id, {
      stage: "prepared",
      kind: "image_analysis",
      congressId: job.congress_id,
      imageId: job.image_id,
      preparedBytes: optimizedBuffer.length,
      previewBytes: previewBuffer.length,
      optimizedWidth: optimizedInfo.width ?? null,
      optimizedHeight: optimizedInfo.height ?? null,
    })
  } catch (phase1Err) {
    log("error", "critical failure in Phase 1 (worker)", { error: phase1Err })
    throw phase1Err
  }

  // --- FASE 2: ANÁLISIS IA ---
  try {
    const { data: result, usage } = await analyzeImage({
      imageUrl: finalAnalysisUrl!,
      zoomLeftUrl: leftBuffer ? `data:image/jpeg;base64,${leftBuffer.toString('base64')}` : undefined,
      zoomRightUrl: rightBuffer ? `data:image/jpeg;base64,${rightBuffer.toString('base64')}` : undefined,
    })
    await writeJobResult(supabase, job.id, {
      stage: "analyzed",
      kind: "image_analysis",
      congressId: job.congress_id,
      imageId: job.image_id,
      provider: usage.provider,
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      referenceCount: result.references?.length ?? 0,
      topicCount: result.topics?.length ?? 0,
    })

    // Auditoría Heurística
    if ((!result.references || result.references.length === 0) && 
        /(\d{4}|et al|doi:|j\. |clin\.|med\.|lancet|nejm)/i.test(result.raw_text)) {
      log("warn", "posible referencia omitida en worker", { imageId: job.image_id })
    }

    const { error: ocrErr } = await supabase.from("ocr_results").upsert({
      image_id: job.image_id,
      // raw_text = literal OCR; cleaned_text mirrors it for now. medical_summary
      // holds the AI inference, kept separate from extracted text (fase32).
      raw_text: result.raw_text,
      cleaned_text: result.raw_text,
      medical_summary: result.medical_summary,
    }, { onConflict: "image_id" })
    if (ocrErr) log("error", "failed to save ocr_results", { error: ocrErr })

    // Tópicos
    if (result.topics?.length > 0) {
      for (const t of result.topics) {
        if (!t.name?.trim()) continue
        const { data: existing } = await supabase
          .from("topics")
          .select("id")
          .eq("congress_id", image.congress_id)
          .eq("name", t.name)
          .maybeSingle()
        let topicId = existing?.id
        if (!topicId) {
          const { data: created } = await supabase
            .from("topics")
            .upsert({
              congress_id: image.congress_id,
              name: t.name,
              category: t.category ?? null,
              description: t.description ?? null,
            }, { onConflict: "congress_id,name" })
            .select("id")
            .single()
          topicId = created?.id
        }
        if (topicId) {
          await supabase
            .from("image_topics")
            .upsert({ image_id: job.image_id, topic_id: topicId }, { onConflict: "image_id,topic_id" })
        }
      }
    }

    // Referencias
    if (result.references?.length > 0) {
      const { data: previousRefs } = await supabase
        .from("reference_candidates")
        .select("id")
        .eq("image_id", job.image_id)
      const { data: insertedRefs, error: insErr } = await supabase.from("reference_candidates").insert(
        result.references.map((r) => ({
          congress_id: image.congress_id,
          image_id: job.image_id,
          user_id: image.user_id,
          raw_reference_text: `${r.detected_title ?? ""} ${r.detected_authors ?? ""} ${r.detected_journal ?? ""}`.trim(),
          detected_title: r.detected_title,
          detected_authors: r.detected_authors,
          detected_year: r.detected_year,
          detected_journal: r.detected_journal,
          detected_doi: r.detected_doi,
          verification_status: "not_verified",
        }))
      ).select()

      if (insErr) {
        log("error", "failed to insert references in worker", { error: insErr })
      } else if (insertedRefs) {
        if (previousRefs?.length) {
          await supabase
            .from("reference_candidates")
            .delete()
            .in("id", previousRefs.map((ref) => ref.id))
        }

        // Decouple verification from analysis (brecha #4): enqueue a background
        // reference_verification job (deduped per congress) instead of verifying
        // inline within this image job's 60s budget. Picked up by a later cron run.
        await enqueueReferenceVerificationIfPending(supabase, {
          userId: image.user_id,
          congressId: image.congress_id,
        })
      }
    }

    await supabase
      .from("congress_images")
      .update({ ai_status: "ai_done", ocr_status: "ocr_done", status: "ocr_done" })
      .eq("id", job.image_id)

    await recordAiUsage({
      userId: image.user_id,
      actionType: "image_analysis",
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      congressId: image.congress_id,
      imageId: job.image_id,
      status: "success",
    })

    await writeJobResult(supabase, job.id, {
      stage: "saved",
      kind: "image_analysis",
      congressId: job.congress_id,
      imageId: job.image_id,
      provider: usage.provider,
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      referenceCount: result.references?.length ?? 0,
      topicCount: result.topics?.length ?? 0,
    })

    revalidatePath(`/dashboard/congresos/${image.congress_id}`)
    revalidatePath("/dashboard/biblioteca")
    return { provider: usage.provider, model: usage.model, references: result.references?.length || 0 }
  } catch (err) {
    const error = err as Error
    log("error", "IA analysis phase failed in worker", { imageId: job.image_id, error: error.message })
    await supabase
      .from("congress_images")
      .update({ ai_status: "ai_failed", ocr_status: "ocr_failed" })
      .eq("id", job.image_id)
    throw err
  }
}

async function runImageDerivation(supabase: SupabaseClient, job: AiJobRow) {
  if (!job.image_id) throw new Error("image_id requerido")

  await writeJobResult(supabase, job.id, {
    stage: "init",
    kind: "image_derivation",
    congressId: job.congress_id,
    imageId: job.image_id,
  })

  const { data: image, error: imgErr } = await supabase
    .from("congress_images")
    .select("id, user_id, congress_id, storage_path, storage_path_optimized, storage_path_thumbnail")
    .eq("id", job.image_id)
    .single()

  if (imgErr || !image) throw new Error(`Imagen no encontrada: ${imgErr?.message}`)

  const sourcePath = image.storage_path
  const { data: downloaded, error: dlErr } = await supabase.storage
    .from("congress-photos")
    .download(sourcePath)

  if (dlErr || !downloaded) {
    throw new Error(`No se pudo descargar la imagen original: ${dlErr?.message ?? "desconocido"}`)
  }

  const buffer = Buffer.from(await downloaded.arrayBuffer())
  const base = sourcePath.replace(/\.[^.]+$/, "")
  const optimizedPath = image.storage_path_optimized ?? `${base}_optimized.jpg`
  const thumbnailPath = image.storage_path_thumbnail ?? `${base}_thumb.webp`

  const optimized = await renderPreparedDerivative(buffer, 3072, 3072, "jpeg", 90)
  const thumb = await renderPreparedDerivative(buffer, 420, 420, "webp", 72)

  const uploadOps = [
    supabase.storage.from("congress-photos").upload(optimizedPath, optimized.data, {
      contentType: "image/jpeg",
      upsert: true,
    }),
    supabase.storage.from("congress-photos").upload(thumbnailPath, thumb.data, {
      contentType: "image/webp",
      upsert: true,
    }),
  ]

  const [optimizedRes, thumbRes] = await Promise.all(uploadOps)
  if (optimizedRes.error) throw new Error(`No se pudo guardar la versión optimizada: ${optimizedRes.error.message}`)
  if (thumbRes.error) throw new Error(`No se pudo guardar la miniatura: ${thumbRes.error.message}`)

  const { error: updateErr } = await supabase
    .from("congress_images")
    .update({
      storage_path_optimized: optimizedPath,
      storage_path_thumbnail: thumbnailPath,
      width_optimized: optimized.info.width ?? null,
      height_optimized: optimized.info.height ?? null,
      width_thumbnail: thumb.info.width ?? null,
      height_thumbnail: thumb.info.height ?? null,
      size_optimized_bytes: optimized.data.length,
      size_thumbnail_bytes: thumb.data.length,
      mime_type_optimized: "image/jpeg",
      mime_type_thumbnail: "image/webp",
      compression_quality: 0.88,
      compression_ratio: buffer.length ? optimized.data.length / buffer.length : null,
      upload_status: "compressed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.image_id)

  if (updateErr) throw new Error(`No se pudo actualizar el registro de imagen: ${updateErr.message}`)

  await writeJobResult(supabase, job.id, {
    stage: "saved",
    kind: "image_derivation",
    congressId: job.congress_id,
    imageId: job.image_id,
    optimizedPath,
    thumbnailPath,
    optimizedBytes: optimized.data.length,
    thumbnailBytes: thumb.data.length,
  })

  revalidatePath(`/dashboard/congresos/${image.congress_id}`)
  revalidatePath(`/dashboard/congresos/${image.congress_id}/resumen`)

  return {
    optimized_path: optimizedPath,
    thumbnail_path: thumbnailPath,
  }
}

async function runTopicsExtraction(supabase: SupabaseClient, job: AiJobRow) {
  if (!job.congress_id) throw new Error("congress_id requerido")

  await writeJobResult(supabase, job.id, {
    stage: "init",
    kind: "topics_extraction",
    congressId: job.congress_id,
  })

  const { data: rows, error: fetchErr } = await supabase
    .from("congress_images")
    .select("id, ocr_results(raw_text, cleaned_text)")
    .eq("congress_id", job.congress_id)
    .order("created_at", { ascending: true })

  if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`)

  // Topics from literal OCR (raw_text), not the AI summary. Legacy fallback.
  const documents = (rows ?? [])
    .map((r, idx) => {
      const row = r as unknown as { id: string; ocr_results: Array<{ raw_text: string | null; cleaned_text: string | null }> | null }
      return {
        index: idx,
        imageId: row.id,
        text: row.ocr_results?.[0]?.raw_text ?? row.ocr_results?.[0]?.cleaned_text ?? "",
      }
    })
    .filter((d) => d.text.trim().length > 0)

  if (documents.length === 0) {
    await writeJobResult(supabase, job.id, {
      stage: "no_ocr",
      kind: "topics_extraction",
      congressId: job.congress_id,
      documentCount: 0,
    })
    return { topicsCreated: 0 }
  }

  await writeJobResult(supabase, job.id, {
    stage: "loaded_ocr",
    kind: "topics_extraction",
    congressId: job.congress_id,
    documentCount: documents.length,
  })

  const { topics, usage } = await extractTopicsFromCorpus({
    documents: documents.map(({ index, text }) => ({ index, text })),
  })

  await writeJobResult(supabase, job.id, {
    stage: "topics_ready",
    kind: "topics_extraction",
    congressId: job.congress_id,
    documentCount: documents.length,
    topicCount: topics.length,
  })

  let createdCount = 0
  for (const t of topics) {
    if (!t.name?.trim()) continue
    const { data: created, error: upsertErr } = await supabase
      .from("topics")
      .upsert({
        congress_id: job.congress_id,
        name: t.name,
        category: t.category,
        description: t.description,
      }, { onConflict: "congress_id,name" })
      .select("id")
      .single()

    if (upsertErr) {
      log("warn", "failed to upsert topic", { topic: t.name, error: upsertErr })
      continue
    }

    if (created?.id) {
      createdCount++
      for (const idx of t.image_indices) {
        const doc = documents[idx]
        if (doc) {
          await supabase
            .from("image_topics")
            .upsert({ image_id: doc.imageId, topic_id: created.id }, { onConflict: "image_id,topic_id" })
        }
      }
    }
  }

  await recordAiUsage({
    userId: job.user_id,
    actionType: "image_analysis", // use general type or specific
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    congressId: job.congress_id,
    status: "success",
  })

  await writeJobResult(supabase, job.id, {
    stage: "saved",
    kind: "topics_extraction",
    congressId: job.congress_id,
    documentCount: documents.length,
    topicCount: topics.length,
    topicsCreated: createdCount,
  })

  revalidatePath(`/dashboard/congresos/${job.congress_id}`)
  revalidatePath(`/dashboard/congresos/${job.congress_id}/resumen`)

  return { topicsCreated: createdCount }
}

async function runReportGeneration(supabase: SupabaseClient, job: AiJobRow) {
  const { language } = job.payload as { language: "es" | "en" }
  if (!language) throw new Error("Payload incompleto para reporte")

  log("info", "generating academic report in background", { congressId: job.congress_id })
  await writeJobResult(supabase, job.id, {
    stage: "init",
    kind: "report_generation",
    language,
    congressId: job.congress_id,
  })

  // 1. Fetch images
  const { data: images } = await supabase
    .from("congress_images")
    .select("id")
    .eq("congress_id", job.congress_id)
    .eq("user_id", job.user_id)

  // 2. Fetch OCR results
  const { data: ocrResults } = await supabase
    .from("ocr_results")
    .select("image_id, raw_text, cleaned_text, medical_summary")
    .in("image_id", images?.map((img) => img.id) || [])

  // 3. Fetch references
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
    .eq("congress_id", job.congress_id)

  await writeJobResult(supabase, job.id, {
    stage: "context_loaded",
    kind: "report_generation",
    language,
    congressId: job.congress_id,
    imageCount: images?.length ?? 0,
    ocrCount: ocrResults?.length ?? 0,
    referenceCount: references?.length ?? 0,
  })

  if (!ocrResults || ocrResults.length === 0) {
    throw new Error("[report_generation/context] No hay datos analizados. Analiza algunas fotos primero.")
  }

  // 4. Build fullText
  const fullText = (images || [])
    .map((img, idx) => {
      const ocrRow = ocrResults.find((o) => o.image_id === img.id)
      // Hybrid: literal OCR is ground truth; AI summary labeled as inference.
      const ocr = ocrRow?.raw_text ?? ocrRow?.cleaned_text
      const aiSummary = ocrRow?.medical_summary
      if (!ocr) return null

      const imgRefs = (references || [])
        .filter((r) => r.image_id === img.id)
        .map((r) => {
          const row = r as any
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

      const aiBlock = aiSummary
        ? `\nSÍNTESIS IA (INFERENCIA, no es texto literal — usar solo como apoyo):\n${aiSummary}`
        : ""
      return `=== FOTO_${idx + 1} ===\nTEXTO DETECTADO EN DIAPOSITIVA (OCR literal):\n${ocr}${aiBlock}\n${imgRefs ? `\nREFERENCIAS Y EVIDENCIA CIENTÍFICA ASOCIADA:\n${imgRefs}` : ""}`
    })
    .filter(Boolean)
    .join("\n\n---\n\n")
    .slice(0, 100_000)

  await writeJobResult(supabase, job.id, {
    stage: "context_built",
    kind: "report_generation",
    language,
    congressId: job.congress_id,
    fullTextLength: fullText.length,
    imageCount: images?.length ?? 0,
    ocrCount: ocrResults?.length ?? 0,
    referenceCount: references?.length ?? 0,
  })

  const { generateReport: aiGenerateReport } = await import("@/lib/ai/router")
  const { content, usage } = await aiGenerateReport({ fullText, language })

  if (!content) throw new Error("[report_generation/llm] IA no generó contenido para el reporte")

  await writeJobResult(supabase, job.id, {
    stage: "llm_ready",
    kind: "report_generation",
    language,
    congressId: job.congress_id,
    provider: usage.provider,
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    fullTextLength: fullText.length,
  })

  const { error: insErr } = await supabase.from("reports").insert({
    congress_id: job.congress_id,
    user_id: job.user_id,
    title: `Esquema Académico Automático (${language.toUpperCase()})`,
    content,
    report_type: "academic_outline",
  })

  if (insErr) throw new Error(`[report_generation/save] Error guardando reporte: ${insErr.message}`)

  await writeJobResult(supabase, job.id, {
    stage: "saved",
    kind: "report_generation",
    language,
    congressId: job.congress_id,
    provider: usage.provider,
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  })

  await recordAiUsage({
    userId: job.user_id,
    actionType: "report_generation",
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    congressId: job.congress_id,
    status: "success",
  })

  revalidatePath(`/dashboard/congresos/${job.congress_id}`)
  revalidatePath(`/dashboard/congresos/${job.congress_id}/resumen`)
  return { success: true, model: usage.model, stage: "saved" }
}

async function runReferenceVerification(supabase: SupabaseClient, job: AiJobRow) {
  if (!job.congress_id) throw new Error("congress_id requerido")

  await writeJobResult(supabase, job.id, {
    stage: "init",
    kind: "reference_verification",
    congressId: job.congress_id,
  })

  const { data: refs, error: fetchErr } = await supabase
    .from("reference_candidates")
    .select("id, raw_reference_text, detected_title, detected_authors, detected_year, detected_journal, detected_doi")
    .eq("congress_id", job.congress_id)
    .neq("verification_status", "verified")
    .neq("verification_status", "retracted")

  if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`)
  if (!refs?.length) {
    await writeJobResult(supabase, job.id, {
      stage: "no_refs",
      kind: "reference_verification",
      congressId: job.congress_id,
      referenceCount: 0,
    })
    return { processed: 0, retracted: 0 }
  }

  log("info", "bulk reference verification in background", { count: refs.length })
  await writeJobResult(supabase, job.id, {
    stage: "loaded_refs",
    kind: "reference_verification",
    congressId: job.congress_id,
    referenceCount: refs.length,
  })

  let processed = 0
  let retracted = 0

  for (const ref of refs) {
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

      await supabase
        .from("reference_candidates")
        .update({
          verification_status: vResult.status,
          confidence_score: vResult.confidenceScore,
          detected_title: vResult.matchedTitle ?? ref.detected_title,
          detected_authors: vResult.matchedAuthors ?? ref.detected_authors,
          detected_year: vResult.matchedYear ?? ref.detected_year,
          detected_journal: vResult.matchedJournal ?? ref.detected_journal,
          detected_doi: vResult.matchedDoi ?? ref.detected_doi,
          detected_pmid: vResult.matchedPmid,
          verification_source: vResult.source,
          verification_notes: vResult.notes,
          official_title: vResult.matchedTitle,
          official_authors: vResult.matchedAuthors,
          official_year: vResult.matchedYear,
          official_journal: vResult.matchedJournal,
          abstract: vResult.abstract,
          publication_type: vResult.publicationType,
        })
        .eq("id", ref.id)

      processed++
      if (vResult.retracted) retracted++
      
      // Prevent rate limits on external APIs
      await new Promise(r => setTimeout(r, 400))
    } catch (err) {
      log("warn", "verification failed for single ref in background", { refId: ref.id, error: err })
    }
  }

  await writeJobResult(supabase, job.id, {
    stage: "saved",
    kind: "reference_verification",
    congressId: job.congress_id,
    referenceCount: refs.length,
    processedCount: processed,
    retractedCount: retracted,
  })

  revalidatePath(`/dashboard/congresos/${job.congress_id}`)
  revalidatePath(`/dashboard/congresos/${job.congress_id}/resumen`)
  revalidatePath("/dashboard/biblioteca")

  return { processed, retracted }
}

async function reclaimStaleProcessingJobs(supabase: SupabaseClient) {
  const cutoff = new Date(Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000).toISOString()
  await supabase
    .from("ai_jobs")
    .update({
      status: "pending",
      error_message: "Reclamado tras expiracion del worker",
      started_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("status", "processing")
    .lt("started_at", cutoff)
}

async function claimNextJob(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("ai_jobs_claim_next", {
    p_worker_id: `vercel-cron-${Date.now()}`,
  })

  if (error) throw error
  return (data ?? null) as AiJobRow | null
}

// =============================================================================
// MAIN WORKER ENDPOINT
// =============================================================================

async function handleWorkerRequest(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  await reclaimStaleProcessingJobs(supabase)
  const processed: Array<{ id: string; jobType: string }> = []
  const failures: Array<{ id: string; error: string }> = []

  for (let i = 0; i < MAX_JOBS_PER_RUN; i++) {
    let job: AiJobRow | null
    try {
      job = await claimNextJob(supabase)
    } catch (jobErr) {
      const message = jobErr instanceof Error ? jobErr.message : "No se pudo reclamar el job"
      return NextResponse.json({ error: message }, { status: 500 })
    }

    if (!job) break

    try {
      let result
      switch (job.job_type) {
        case "image_analysis": result = await runImageAnalysis(supabase, job); break
        case "image_derivation": result = await runImageDerivation(supabase, job); break
        case "topics_extraction": result = await runTopicsExtraction(supabase, job); break
        case "report_generation": result = await runReportGeneration(supabase, job); break
        case "reference_verification": result = await runReferenceVerification(supabase, job); break
        default:
          throw new Error(`Tipo de job desconocido: ${job.job_type}`)
      }

      await supabase.from("ai_jobs").update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        result,
      }).eq("id", job.id)

      processed.push({ id: job.id, jobType: job.job_type })
    } catch (err) {
      const error = err as Error
      await writeJobResult(supabase, job.id, {
        stage: "failed",
        kind: job.job_type,
        congressId: job.congress_id,
        imageId: job.image_id,
        error: error.message,
      })
      await supabase.from("ai_jobs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: error.message,
      }).eq("id", job.id)
      failures.push({ id: job.id, error: error.message })
    }
  }

  return NextResponse.json({
    success: true,
    processed: processed.length,
    failures: failures.length,
    jobs: processed,
  })
}

export async function GET(request: Request) {
  return handleWorkerRequest(request)
}

export async function POST(request: Request) {
  return handleWorkerRequest(request)
}
