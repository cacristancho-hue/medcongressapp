// Cron-triggered worker that processes one ai_jobs row per invocation.
// Authentication: Bearer token = CRON_SECRET (must match env var).
// Vercel Cron will hit this endpoint every minute on Pro plan.
//
// Why one-job-per-call:
// 1. Avoids Vercel 10s/60s function timeouts.
// 2. Each call is an independent transaction.
// 3. Simple scaling: more cron hits = more throughput.

import { createServiceClient } from "@/lib/supabase/service"
import { analyzeImage, extractTopicsFromCorpus } from "@/lib/ai/router"
import { recordAiUsage } from "@/lib/ai-usage"
import { verifyReference } from "@/lib/reference-verification"
import { NextResponse } from "next/server"
import { execSync } from "child_process"
import path from "path"
import fs from "fs"
import os from "os"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // 60s max for image vision processing

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

interface AiJobRow {
  id: string
  job_type: "image_analysis" | "report_generation" | "topics_extraction" | "reference_verification"
  status: "pending" | "processing" | "completed" | "failed"
  payload: Record<string, unknown>
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

  const { data: image, error: imgErr } = await supabase
    .from("congress_images")
    .select("id, user_id, congress_id, storage_path, storage_path_optimized")
    .eq("id", job.image_id)
    .single()

  if (imgError || !image) throw new Error(`Imagen no encontrada: ${imgErr?.message}`)

  log("info", "starting robust image analysis", { imageId: job.image_id })

  // --- FASE 1: OPTIMIZACIÓN Y RECTIFICACIÓN ---
  let finalAnalysisUrl: string | null = null
  let leftBuffer: Buffer | undefined
  let rightBuffer: Buffer | undefined
  let originalSignedUrl: string | null = null

  try {
    const { data: signed } = await supabase.storage
      .from("congress-photos")
      .createSignedUrl(image.storage_path, 900) 
    if (!signed?.signedUrl) throw new Error("No pudo firmarse la URL de la imagen original")
    originalSignedUrl = signed.signedUrl

    const inputPath = path.join(os.tmpdir(), `input_job_${job.image_id}.jpg`)
    const outputPath = path.join(os.tmpdir(), `optimized_job_${job.image_id}.jpg`)

    const response = await fetch(originalSignedUrl)
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(inputPath, buffer)

    const optimizeScript = path.join(process.cwd(), "tools", "optimize_slide.py")
    const pythonPath = process.env.PYTHON_PATH || "python"

    try {
      execSync(`${pythonPath} "${optimizeScript}" "${inputPath}" "${outputPath}"`)
      
      const optimizedBuffer = fs.readFileSync(outputPath)
      const rectifiedPath = image.storage_path.split('.').slice(0, -1).join('.') + '_rectified.jpg'
      
      const leftPath = outputPath.replace(".jpg", "_zL.jpg")
      const rightPath = outputPath.replace(".jpg", "_zR.jpg")
      
      if (fs.existsSync(leftPath)) leftBuffer = fs.readFileSync(leftPath)
      if (fs.existsSync(rightPath)) rightBuffer = fs.readFileSync(rightPath)

      await supabase.storage
        .from("congress-photos")
        .upload(rectifiedPath, optimizedBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        })

      await supabase
        .from("congress_images")
        .update({ storage_path_optimized: rectifiedPath, status: "optimized" })
        .eq("id", job.image_id)

      finalAnalysisUrl = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`
      
      // Limpieza de archivos temporales
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
      if (fs.existsSync(leftPath)) fs.unlinkSync(leftPath)
      if (fs.existsSync(rightPath)) fs.unlinkSync(rightPath)
    } catch (execErr) {
      log("warn", "slide optimization failed in worker, using original", { error: execErr })
      finalAnalysisUrl = originalSignedUrl
    }
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

    // Auditoría Heurística
    if ((!result.references || result.references.length === 0) && 
        /(\d{4}|et al|doi:|j\. |clin\.|med\.|lancet|nejm)/i.test(result.raw_text)) {
      log("warn", "posible referencia omitida en worker", { imageId: job.image_id })
    }

    const { error: ocrErr } = await supabase.from("ocr_results").upsert({
      image_id: job.image_id,
      raw_text: result.raw_text,
      cleaned_text: result.medical_summary,
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
      await supabase.from("reference_candidates").delete().eq("image_id", job.image_id)
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
            }).eq("id", ref.id)
          } catch (vErr) {
            log("warn", "auto-verify failed in worker", { refId: ref.id, error: vErr })
          }
        }
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

async function runTopicsExtraction(supabase: SupabaseClient, job: AiJobRow) {
  if (!job.congress_id) throw new Error("congress_id requerido")

  const { data: rows, error: fetchErr } = await supabase
    .from("congress_images")
    .select("id, ocr_results(cleaned_text)")
    .eq("congress_id", job.congress_id)
    .order("created_at", { ascending: true })

  if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`)

  const documents = (rows ?? [])
    .map((r, idx) => {
      const row = r as unknown as { id: string; ocr_results: Array<{ cleaned_text: string | null }> | null }
      return {
        index: idx,
        imageId: row.id,
        text: row.ocr_results?.[0]?.cleaned_text ?? "",
      }
    })
    .filter((d) => d.text.trim().length > 0)

  if (documents.length === 0) return { topicsCreated: 0 }

  const { topics, usage } = await extractTopicsFromCorpus({
    documents: documents.map(({ index, text }) => ({ index, text })),
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

  return { topicsCreated: createdCount }
}

async function runReportGeneration(supabase: SupabaseClient, job: AiJobRow) {
  const { fullText, language } = job.payload as { fullText: string; language: "es" | "en" }
  if (!fullText || !language) throw new Error("Payload incompleto para reporte")

  log("info", "generating academic report in background", { congressId: job.congress_id })

  const { generateReport: aiGenerateReport } = await import("@/lib/ai/router")
  const { content, usage } = await aiGenerateReport({ fullText, language })

  if (!content) throw new Error("IA no generó contenido para el reporte")

  const { error: insErr } = await supabase.from("reports").insert({
    congress_id: job.congress_id,
    user_id: job.user_id,
    title: `Esquema Académico Automático (${language.toUpperCase()})`,
    content,
    report_type: "academic_outline",
  })

  if (insErr) throw new Error(`Error guardando reporte: ${insErr.message}`)

  await recordAiUsage({
    userId: job.user_id,
    actionType: "report_generation",
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    congressId: job.congress_id,
    status: "success",
  })

  return { success: true, model: usage.model }
}

async function runReferenceVerification(supabase: SupabaseClient, job: AiJobRow) {
  if (!job.congress_id) throw new Error("congress_id requerido")

  const { data: refs, error: fetchErr } = await supabase
    .from("reference_candidates")
    .select("id, raw_reference_text, detected_title, detected_authors, detected_year, detected_journal, detected_doi")
    .eq("congress_id", job.congress_id)
    .neq("verification_status", "verified")
    .neq("verification_status", "retracted")

  if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`)
  if (!refs?.length) return { processed: 0, retracted: 0 }

  log("info", "bulk reference verification in background", { count: refs.length })

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

  return { processed, retracted }
}

// =============================================================================
// MAIN WORKER ENDPOINT
// =============================================================================

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: job, error: jobErr } = await supabase
    .from("ai_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 })
  if (!job) return NextResponse.json({ message: "No jobs pending" })

  await supabase.from("ai_jobs").update({ status: "processing", started_at: new Date().toISOString() }).eq("id", job.id)

  try {
    let result
    switch (job.job_type) {
      case "image_analysis": result = await runImageAnalysis(supabase, job); break
      case "topics_extraction": result = await runTopicsExtraction(supabase, job); break
      case "report_generation": result = await runReportGeneration(supabase, job); break
      case "reference_verification": result = await runReferenceVerification(supabase, job); break
    }

    await supabase.from("ai_jobs").update({
      status: "completed",
      finished_at: new Date().toISOString(),
      result,
    }).eq("id", job.id)

    return NextResponse.json({ success: true, jobId: job.id })
  } catch (err) {
    const error = err as Error
    await supabase.from("ai_jobs").update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: error.message,
    }).eq("id", job.id)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
