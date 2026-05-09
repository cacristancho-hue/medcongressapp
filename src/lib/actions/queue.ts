"use server"

import { enqueueJob } from "@/lib/jobs"
import { withAction } from "@/lib/with-action"

interface EnqueueImageInput {
  imageId: string
  congressId: string
}

export const enqueueImageAnalysis = withAction({
  name: "ai.image_analysis",
  rateLimit: "image_analysis",
  // No quota check here: quota is enforced when the worker runs the job.
})(async ({ user, supabase }, input: EnqueueImageInput) => {
  // Ownership gate.
  const { data: image } = await supabase
    .from("congress_images")
    .select("id, congress_id, organization_id")
    .eq("id", input.imageId)
    .eq("user_id", user.id)
    .single()

  if (!image) throw new Error("Imagen no encontrada o no autorizada")

  const { id, error } = await enqueueJob({
    userId: user.id,
    organizationId: image.organization_id ?? null,
    jobType: "image_analysis",
    payload: { imageId: input.imageId },
    congressId: input.congressId,
    imageId: input.imageId,
    priority: 100,
  })

  if (error || !id) throw new Error(error ?? "No se pudo encolar el análisis")
  return { jobId: id }
})

interface EnqueueReportInput {
  congressId: string
  language: "es" | "en"
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

  const { id, error } = await enqueueJob({
    userId: user.id,
    organizationId: congress.organization_id ?? null,
    jobType: "report_generation",
    payload: { language: input.language },
    congressId: input.congressId,
    priority: 50, // higher priority than per-image analysis
  })

  if (error || !id) throw new Error(error ?? "No se pudo encolar el reporte")
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
    payload: {},
    congressId,
    priority: 50,
  })

  if (error || !id) throw new Error(error ?? "No se pudo encolar la extracción")
  return { jobId: id }
})
