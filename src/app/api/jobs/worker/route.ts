// Cron-triggered worker that processes one ai_jobs row per invocation.
// Authentication: Bearer token = CRON_SECRET (must match env var).
// Vercel Cron will hit this endpoint every minute on Pro plan.
//
// Why one-job-per-call: keeps function execution under Vercel's 60s budget,
// avoids partial state on cold start, and gives natural backoff per item.
// For high volume we can fan out (claim N at a time) later.

import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { analyzeImage, generateReport, extractTopicsFromCorpus } from "@/lib/ai/router"
import { verifyReference } from "@/lib/reference-verification"
import { recordAiUsage } from "@/lib/ai-usage"
import { log } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface AiJobRow {
  id: string
  user_id: string
  organization_id: string | null
  job_type: "image_analysis" | "topics_extraction" | "report_generation" | "reference_verification"
  status: string
  payload: Record<string, unknown>
  congress_id: string | null
  image_id: string | null
  attempt_count: number
  max_attempts: number
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return unauthorized()
  }

  const supabase = createServiceClient()

  // Claim next pending job atomically (ai_jobs_claim_next uses FOR UPDATE SKIP LOCKED).
  const { data: claimed, error: claimErr } = await supabase.rpc("ai_jobs_claim_next", {
    p_worker_id: "vercel-cron",
  })

  if (claimErr) {
    log("error", "worker claim failed", { err: claimErr.message })
    return NextResponse.json({ error: claimErr.message }, { status: 500 })
  }

  if (!claimed || (Array.isArray(claimed) && claimed.length === 0)) {
    return NextResponse.json({ message: "no pending jobs" })
  }

  const job: AiJobRow = Array.isArray(claimed) ? claimed[0] : claimed

  try {
    let result: Record<string, unknown> = {}
    switch (job.job_type) {
      case "image_analysis":
        result = await runImageAnalysis(supabase, job)
        break
      case "topics_extraction":
        result = await runTopicsExtraction(supabase, job)
        break
      case "report_generation":
        result = await runReportGeneration(supabase, job)
        break
      case "reference_verification":
        result = await runReferenceVerification(supabase, job)
        break
      default:
        throw new Error(`Unknown job_type: ${job.job_type}`)
    }

    await supabase
      .from("ai_jobs")
      .update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        result,
      })
      .eq("id", job.id)

    return NextResponse.json({ jobId: job.id, status: "succeeded", result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown"
    log("error", "worker job failed", { jobId: job.id, jobType: job.job_type, err: message })

    const finalState =
      job.attempt_count >= job.max_attempts ? "failed" : "pending"

    await supabase
      .from("ai_jobs")
      .update({
        status: finalState,
        error_message: message,
        finished_at: finalState === "failed" ? new Date().toISOString() : null,
      })
      .eq("id", job.id)

    return NextResponse.json(
      { jobId: job.id, status: finalState, error: message },
      { status: 200 }
    )
  }
}

// =============================================================================
// Job runners. Each receives a service-role supabase + the job row.
// =============================================================================

interface SupabaseService {
  from: ReturnType<typeof createServiceClient>["from"]
  storage: ReturnType<typeof createServiceClient>["storage"]
}

async function runImageAnalysis(supabase: SupabaseService, job: AiJobRow) {
  if (!job.image_id) throw new Error("image_id requerido")

  const { data: image } = await supabase
    .from("congress_images")
    .select("id, user_id, congress_id, storage_path, storage_path_optimized")
    .eq("id", job.image_id)
    .single()

  if (!image) throw new Error("Imagen no encontrada")

  const { data: signed } = await supabase.storage
    .from("congress-photos")
    .createSignedUrl(image.storage_path_optimized || image.storage_path, 300)
  if (!signed?.signedUrl) throw new Error("No se pudo firmar URL")

  const { data: result, usage } = await analyzeImage({ imageUrl: signed.signedUrl })

  await supabase.from("ocr_results").insert({
    image_id: job.image_id,
    raw_text: result.raw_text,
    cleaned_text: result.medical_summary,
  })

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
          .insert({
            congress_id: image.congress_id,
            name: t.name,
            category: t.category ?? null,
            description: t.description ?? null,
          })
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

  if (result.references?.length > 0) {
    await supabase.from("reference_candidates").insert(
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
    )
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

  return { provider: usage.provider, model: usage.model }
}

async function runTopicsExtraction(supabase: SupabaseService, job: AiJobRow) {
  if (!job.congress_id) throw new Error("congress_id requerido")

  const { data: rows } = await supabase
    .from("congress_images")
    .select("id, ocr_results(cleaned_text)")
    .eq("congress_id", job.congress_id)
    .order("created_at", { ascending: true })

  type Row = { id: string; ocr_results: Array<{ cleaned_text: string | null }> | null }
  const documents = ((rows ?? []) as Row[])
    .map((r, idx) => ({
      index: idx,
      imageId: r.id,
      text: r.ocr_results?.[0]?.cleaned_text ?? "",
    }))
    .filter((d) => d.text.trim().length > 0)

  if (documents.length === 0) throw new Error("No hay OCR previo")

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
      .eq("congress_id", job.congress_id)
      .eq("name", t.name)
      .maybeSingle()
    let topicId = existing?.id
    if (!topicId) {
      const { data: created } = await supabase
        .from("topics")
        .insert({
          congress_id: job.congress_id,
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
      const { error } = await supabase
        .from("image_topics")
        .upsert({ image_id: doc.imageId, topic_id: topicId }, { onConflict: "image_id,topic_id" })
      if (!error) linksCreated++
    }
  }

  await recordAiUsage({
    userId: job.user_id,
    actionType: "image_analysis",
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    congressId: job.congress_id,
    status: "success",
  })

  return { topicsCreated, linksCreated, model: usage.model }
}

async function runReportGeneration(supabase: SupabaseService, job: AiJobRow) {
  if (!job.congress_id) throw new Error("congress_id requerido")
  const language = (job.payload?.language as "es" | "en") ?? "es"

  const { data: images } = await supabase
    .from("congress_images")
    .select("id")
    .eq("congress_id", job.congress_id)

  const { data: ocrData } = await supabase
    .from("ocr_results")
    .select("cleaned_text")
    .in("image_id", (images ?? []).map((img) => img.id))

  if (!ocrData || ocrData.length === 0) throw new Error("Sin OCR previo")

  const fullText = ocrData
    .map((d) => d.cleaned_text)
    .filter(Boolean)
    .join("\n\n---\n\n")
    .slice(0, 100_000)

  const { content, usage } = await generateReport({ fullText, language })
  if (!content) throw new Error("IA no generó contenido")

  await supabase.from("reports").insert({
    congress_id: job.congress_id,
    user_id: job.user_id,
    title: `Esquema Académico (${language.toUpperCase()})`,
    content,
    report_type: "academic_outline",
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

  return { provider: usage.provider, model: usage.model }
}

async function runReferenceVerification(supabase: SupabaseService, job: AiJobRow) {
  const refId = job.payload?.referenceId as string | undefined
  if (!refId) throw new Error("referenceId requerido")

  const { data: ref } = await supabase
    .from("reference_candidates")
    .select("id, raw_reference_text, detected_title, detected_authors, detected_year, detected_journal, detected_doi")
    .eq("id", refId)
    .single()
  if (!ref) throw new Error("Referencia no encontrada")

  const result = await verifyReference({
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
      verification_status: result.status,
      confidence_score: result.confidenceScore,
      detected_title: result.matchedTitle ?? ref.detected_title,
      detected_authors: result.matchedAuthors ?? ref.detected_authors,
      detected_year: result.matchedYear ?? ref.detected_year,
      detected_journal: result.matchedJournal ?? ref.detected_journal,
      detected_doi: result.matchedDoi ?? ref.detected_doi,
      detected_pmid: result.matchedPmid,
      verification_source: result.source,
      verification_notes: result.notes,
    })
    .eq("id", refId)

  return { status: result.status, retracted: result.retracted }
}
