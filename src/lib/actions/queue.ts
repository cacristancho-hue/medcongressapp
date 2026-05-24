"use server"

import { enqueueJob } from "@/lib/jobs"
import { kickQueuedAiJobs } from "@/lib/worker-kick"
import { withAction } from "@/lib/with-action"
import { processImageWithAI } from "@/lib/actions/ai-processing"
import { getImageFastPathLimit } from "@/lib/plan-limits"
import { getActiveLocale } from "@/lib/actions/locale"

interface EnqueueImageInput {
  imageId: string
  congressId: string
}

interface EnqueueDerivationInput {
  imageId: string
  congressId: string
}

const RETRYABLE_IMAGE_STATUSES = ["pending", "ai_failed"] as const
const BLOCKING_IMAGE_STATUSES = ["ai_pending", "ai_done"] as const
const STALE_PROCESSING_MINUTES = 20

type ActiveJobRow = {
  id: string
  status: "pending" | "processing"
  started_at: string | null
}

function hasLiveActiveJobs(jobs: ActiveJobRow[] | null | undefined) {
  if (!jobs?.length) return false
  const staleCutoff = Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000
  return jobs.some((job) => {
    if (job.status === "pending") return true
    if (job.status !== "processing") return false
    if (!job.started_at) return true
    return new Date(job.started_at).getTime() >= staleCutoff
  })
}

export const enqueueImageAnalysis = withAction({
  name: "ai.image_analysis",
  rateLimit: "image_analysis",
  // No quota check here: quota is enforced when the worker runs the job.
})(async ({ user, supabase }, input: EnqueueImageInput) => {
  // Ownership gate.
  const { data: image } = await supabase
    .from("congress_images")
    .select("id, congress_id, ai_status")
    .eq("id", input.imageId)
    .eq("user_id", user.id)
    .single()

  if (!image) throw new Error("Imagen no encontrada o no autorizada")
  if (image.ai_status && BLOCKING_IMAGE_STATUSES.includes(image.ai_status as (typeof BLOCKING_IMAGE_STATUSES)[number])) {
    return { jobId: null, message: "Esta foto ya está en cola o ya fue procesada." }
  }

  const { data: congress } = await supabase
    .from("congresses")
    .select("organization_id")
    .eq("id", image.congress_id)
    .eq("user_id", user.id)
    .single()

  if (!congress) throw new Error("Congreso no encontrado o no autorizado")

  const previousAiStatus = image.ai_status ?? "pending"
  await supabase
    .from("congress_images")
    .update({ ai_status: "ai_pending", ocr_status: "ocr_pending" })
    .eq("id", input.imageId)
    .eq("user_id", user.id)

  const { id, error } = await enqueueJob({
    userId: user.id,
    organizationId: congress.organization_id ?? null,
    jobType: "image_analysis",
    payload: { imageId: input.imageId, language: await getActiveLocale() },
    congressId: input.congressId,
    imageId: input.imageId,
    priority: 100,
  })

  if (error || !id) {
    await supabase
      .from("congress_images")
      .update({ ai_status: previousAiStatus, ocr_status: previousAiStatus === "ai_failed" ? "ocr_failed" : "pending" })
      .eq("id", input.imageId)
      .eq("user_id", user.id)
    throw new Error(error ?? "No se pudo encolar el análisis")
  }
  void kickQueuedAiJobs().catch((err) => {
    console.warn("[queue] worker kick failed for image_analysis:", err instanceof Error ? err.message : err)
  })
  return { jobId: id }
})

export const enqueueImageDerivation = withAction({
  name: "image.derivation",
})(async ({ user, supabase }, input: EnqueueDerivationInput) => {
  const { data: image } = await supabase
    .from("congress_images")
    .select("id, congress_id")
    .eq("id", input.imageId)
    .eq("user_id", user.id)
    .single()

  if (!image) throw new Error("Imagen no encontrada o no autorizada")

  const { data: congress } = await supabase
    .from("congresses")
    .select("organization_id")
    .eq("id", image.congress_id)
    .eq("user_id", user.id)
    .single()

  if (!congress) throw new Error("Congreso no encontrado o no autorizado")

  const { id, error } = await enqueueJob({
    userId: user.id,
    organizationId: congress.organization_id ?? null,
    jobType: "image_derivation",
    payload: { imageId: input.imageId },
    congressId: input.congressId,
    imageId: input.imageId,
    priority: 40,
  })

  if (error || !id) throw new Error(error ?? "No se pudo encolar la derivación")
  void kickQueuedAiJobs().catch((err) => {
    console.warn("[queue] worker kick failed for image_derivation:", err instanceof Error ? err.message : err)
  })
  return { jobId: id }
})

export const enqueueCongressAnalysis = withAction({
  name: "ai.bulk_analysis",
})(async ({ user, supabase }, congressId: string) => {
  // 1. Verificar propiedad del congreso
  const { data: congress } = await supabase
    .from("congresses")
    .select("id, organization_id")
    .eq("id", congressId)
    .eq("user_id", user.id)
    .single()

  if (!congress) throw new Error("Congreso no encontrado")

  const { data: limits } = await supabase
    .from("ai_usage_limits")
    .select("plan, monthly_image_quota")
    .eq("user_id", user.id)
    .maybeSingle()

  const { data: activeJobs } = await supabase
    .from("ai_jobs")
    .select("id, status, started_at")
    .eq("congress_id", congressId)
    .in("status", ["pending", "processing"])
    .limit(1)

  if (hasLiveActiveJobs(activeJobs as ActiveJobRow[] | null | undefined)) {
    return { enqueued: 0, message: "Ya hay procesamiento con IA en curso para este congreso." }
  }

  // 2. Buscar imágenes que no tengan status 'ai_done'
  const { data: images } = await supabase
    .from("congress_images")
    .select("id, ai_status")
    .eq("congress_id", congressId)
    .eq("user_id", user.id)
    .or("ai_status.is.null,ai_status.in.(pending,ai_failed)")

  if (!images || images.length === 0) {
    return { enqueued: 0, message: "Todas las imágenes ya están procesadas, en cola o no hay imágenes." }
  }

  // Hot path: para congresos pequeños analizamos de inmediato.
  // Esto evita depender del worker/cron cuando el usuario espera ver resultados ya.
  const HOT_PATH_LIMIT = getImageFastPathLimit(limits?.plan, limits?.monthly_image_quota)
  if (images.length <= HOT_PATH_LIMIT) {
    let processed = 0
    let failed = 0

    for (const img of images) {
      try {
        const result = await processImageWithAI(img.id)
        if (result.success) {
          processed++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    return {
      enqueued: 0,
      processed,
      failed,
      message:
        failed > 0
          ? `Se analizaron ${processed} fotos y ${failed} fallaron.`
          : `Se analizaron ${processed} fotos con IA en modo inmediato.`,
    }
  }

  // 3. Encolar cada una
  const locale = await getActiveLocale()
  let enqueued = 0
  for (const img of images) {
    const previousAiStatus = img.ai_status ?? "pending"
    await supabase
      .from("congress_images")
      .update({ ai_status: "ai_pending", ocr_status: "ocr_pending" })
      .eq("id", img.id)
      .eq("user_id", user.id)

    const { id } = await enqueueJob({
      userId: user.id,
      organizationId: congress.organization_id ?? null,
      jobType: "image_analysis",
      payload: { imageId: img.id, language: locale },
      congressId,
      imageId: img.id,
      priority: 100,
    })
    if (id) {
      enqueued++
    } else {
      await supabase
        .from("congress_images")
        .update({
          ai_status: previousAiStatus,
          ocr_status: previousAiStatus === "ai_failed" ? "ocr_failed" : "pending",
        })
        .eq("id", img.id)
        .eq("user_id", user.id)
    }
  }

  return { enqueued, total: images.length }
})

// Re-analiza TODAS las imágenes del congreso (incluidas las ya 'ai_done'), para
// regenerar campos nuevos del pipeline (slide_text, image_type, análisis por
// especialidad). A diferencia de enqueueCongressAnalysis, no salta las hechas.
// Consume cuota/costo de IA → es una acción deliberada del usuario.
export const reanalyzeCongress = withAction({
  name: "ai.bulk_analysis",
})(async ({ user, supabase }, congressId: string) => {
  const { data: congress } = await supabase
    .from("congresses")
    .select("id, organization_id")
    .eq("id", congressId)
    .eq("user_id", user.id)
    .single()

  if (!congress) throw new Error("Congreso no encontrado")

  // Evita duplicar si ya hay procesamiento en curso.
  const { data: activeJobs } = await supabase
    .from("ai_jobs")
    .select("id, status, started_at")
    .eq("congress_id", congressId)
    .in("status", ["pending", "processing"])
    .limit(1)

  if (hasLiveActiveJobs(activeJobs as ActiveJobRow[] | null | undefined)) {
    return { enqueued: 0, message: "Ya hay procesamiento con IA en curso para este congreso." }
  }

  const { data: images } = await supabase
    .from("congress_images")
    .select("id")
    .eq("congress_id", congressId)
    .eq("user_id", user.id)
    .is("deleted_at", null)

  if (!images || images.length === 0) {
    return { enqueued: 0, message: "No hay imágenes para re-analizar." }
  }

  const locale = await getActiveLocale()
  let enqueued = 0
  for (const img of images) {
    await supabase
      .from("congress_images")
      .update({ ai_status: "ai_pending", ocr_status: "ocr_pending" })
      .eq("id", img.id)
      .eq("user_id", user.id)

    const { id } = await enqueueJob({
      userId: user.id,
      organizationId: congress.organization_id ?? null,
      jobType: "image_analysis",
      payload: { imageId: img.id, language: locale },
      congressId,
      imageId: img.id,
      priority: 90,
    })
    if (id) enqueued++
  }

  void kickQueuedAiJobs().catch((err) => {
    console.warn("[queue] worker kick failed for reanalyze:", err instanceof Error ? err.message : err)
  })

  return { enqueued, total: images.length, message: `Re-análisis encolado para ${enqueued} imagen(es).` }
})

interface EnqueueReportInput {
  congressId: string
  language: "es" | "en"
  // Optional: scope the report to a single session (ponencia). null/undefined = whole congress.
  sessionId?: string | null
}

export const enqueueReportGeneration = withAction({
  name: "ai.report_generation",
  rateLimit: "report_generation",
})(async ({ user, supabase }, input: EnqueueReportInput) => {
  const { data: congress } = await supabase
    .from("congresses")
    .select("id, organization_id")
    .eq("id", input.congressId)
    .eq("user_id", user.id)
    .single()

  if (!congress) throw new Error("Congreso no encontrado")

  // Dedup within the same scope: a pending congress-wide report shouldn't block
  // a session report (and vice versa). Match the sessionId carried in payload.
  let activeQuery = supabase
    .from("ai_jobs")
    .select("id, status, started_at")
    .eq("congress_id", input.congressId)
    .eq("job_type", "report_generation")
    .in("status", ["pending", "processing"])
  activeQuery = input.sessionId
    ? activeQuery.contains("payload", { sessionId: input.sessionId })
    : activeQuery.contains("payload", { sessionId: null })
  const { data: activeJobs } = await activeQuery.limit(1)

  if (hasLiveActiveJobs(activeJobs as ActiveJobRow[] | null | undefined)) {
    return { jobId: activeJobs?.[0]?.id ?? null, message: "Ya hay un reporte en proceso para este alcance." }
  }

  const { id, error } = await enqueueJob({
    userId: user.id,
    organizationId: congress.organization_id ?? null,
    jobType: "report_generation",
    payload: { language: input.language, sessionId: input.sessionId ?? null },
    congressId: input.congressId,
    priority: 50, // higher priority than per-image analysis
  })

  if (error || !id) throw new Error(error ?? "No se pudo encolar el reporte")
  void kickQueuedAiJobs().catch((err) => {
    console.warn("[queue] worker kick failed for report_generation:", err instanceof Error ? err.message : err)
  })
  return { jobId: id }
})

export const enqueueTopicsExtraction = withAction({
  name: "ai.topics_extraction",
  rateLimit: "image_analysis",
})(async ({ user, supabase }, congressId: string) => {
  const { data: congress } = await supabase
    .from("congresses")
    .select("id, organization_id")
    .eq("id", congressId)
    .eq("user_id", user.id)
    .single()

  if (!congress) throw new Error("Congreso no encontrado")

  const { id, error } = await enqueueJob({
    userId: user.id,
    organizationId: congress.organization_id ?? null,
    jobType: "topics_extraction",
    payload: { language: await getActiveLocale() },
    congressId,
    priority: 50,
  })

  if (error || !id) throw new Error(error ?? "No se pudo encolar la extracción")
  void kickQueuedAiJobs().catch((err) => {
    console.warn("[queue] worker kick failed for topics_extraction:", err instanceof Error ? err.message : err)
  })
  return { jobId: id }
})

export const enqueueReferenceVerification = withAction({
  name: "reference.verify",
  rateLimit: "report_generation",
})(async ({ user, supabase }, congressId: string) => {
  const { data: congress } = await supabase
    .from("congresses")
    .select("id, organization_id")
    .eq("id", congressId)
    .eq("user_id", user.id)
    .single()

  if (!congress) throw new Error("Congreso no encontrado")

  const { id, error } = await enqueueJob({
    userId: user.id,
    organizationId: congress.organization_id ?? null,
    jobType: "reference_verification",
    payload: {},
    congressId,
    priority: 75,
  })

  if (error || !id) throw new Error(error ?? "No se pudo encolar la verificación")
  void kickQueuedAiJobs().catch((err) => {
    console.warn("[queue] worker kick failed for reference_verification:", err instanceof Error ? err.message : err)
  })
  return { jobId: id }
})

export const retryAiJob = withAction({
  name: "ai.retry_job",
})(async ({ user, supabase }, jobId: string) => {
  const { data: job } = await supabase
    .from("ai_jobs")
    .select("id, user_id, congress_id, job_type, image_id, payload, status")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single()

  if (!job) throw new Error("Job no encontrado o no autorizado")

  const { data: congress } = await supabase
    .from("congresses")
    .select("organization_id")
    .eq("id", job.congress_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!congress) throw new Error("Congreso no encontrado o no autorizado")

  const payload = (job.payload ?? {}) as Record<string, unknown>

  switch (job.job_type) {
    case "image_analysis": {
      if (!job.image_id) throw new Error("image_id requerido")
      await supabase
        .from("congress_images")
        .update({ ai_status: "ai_pending", ocr_status: "ocr_pending" })
        .eq("id", job.image_id)
        .eq("user_id", user.id)
      const { id, error } = await enqueueJob({
        userId: user.id,
        organizationId: congress.organization_id ?? null,
        jobType: "image_analysis",
        payload: { imageId: job.image_id },
        congressId: job.congress_id,
        imageId: job.image_id,
        priority: 100,
      })
      if (error || !id) throw new Error(error ?? "No se pudo reintentar el análisis")
      break
    }
    case "image_derivation": {
      if (!job.image_id) throw new Error("image_id requerido")
      const { id, error } = await enqueueJob({
        userId: user.id,
        organizationId: congress.organization_id ?? null,
        jobType: "image_derivation",
        payload: { imageId: job.image_id },
        congressId: job.congress_id,
        imageId: job.image_id,
        priority: 40,
      })
      if (error || !id) throw new Error(error ?? "No se pudo reintentar la derivación")
      break
    }
    case "topics_extraction": {
      const { id, error } = await enqueueJob({
        userId: user.id,
        organizationId: congress.organization_id ?? null,
        jobType: "topics_extraction",
        payload: {},
        congressId: job.congress_id,
        priority: 50,
      })
      if (error || !id) throw new Error(error ?? "No se pudo reintentar la extracción")
      break
    }
    case "report_generation": {
      const language = (payload.language === "en" ? "en" : "es") as "es" | "en"
      const { id, error } = await enqueueJob({
        userId: user.id,
        organizationId: congress.organization_id ?? null,
        jobType: "report_generation",
        payload: { language },
        congressId: job.congress_id,
        priority: 50,
      })
      if (error || !id) throw new Error(error ?? "No se pudo reintentar el reporte")
      break
    }
    case "reference_verification": {
      const { id, error } = await enqueueJob({
        userId: user.id,
        organizationId: congress.organization_id ?? null,
        jobType: "reference_verification",
        payload: {},
        congressId: job.congress_id,
        priority: 75,
      })
      if (error || !id) throw new Error(error ?? "No se pudo reintentar la verificación")
      break
    }
    default:
      throw new Error(`Tipo de job no soportado: ${job.job_type}`)
  }

  void kickQueuedAiJobs().catch((err) => {
    console.warn("[queue] worker kick failed for retry:", err instanceof Error ? err.message : err)
  })

  return { ok: true, jobType: job.job_type }
})
