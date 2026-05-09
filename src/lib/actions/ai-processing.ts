"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkAiQuota, recordAiUsage } from "@/lib/ai-usage"
import { analyzeImage } from "@/lib/ai/router"

function isAiEnabled() {
  return process.env.MEDCONGRESS_AI_ENABLED === "true"
}

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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const { data: image, error: imgError } = await supabase
    .from("congress_images")
    .select("id, user_id, congress_id, storage_path, storage_path_optimized")
    .eq("id", imageId)
    .eq("user_id", user.id)
    .single()

  if (imgError || !image) {
    return { error: "Imagen no encontrada o no autorizada" }
  }

  const quota = await checkAiQuota(user.id, "image_analysis")
  if (!quota.allowed) {
    await recordAiUsage({
      userId: user.id,
      actionType: "image_analysis",
      model: "router-blocked",
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
    return { success: true, data: result, provider: usage.provider }
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
      model: "router-error",
      congressId: image.congress_id,
      imageId,
      status: "error",
      errorMessage,
    })

    return { error: errorMessage }
  }
}
