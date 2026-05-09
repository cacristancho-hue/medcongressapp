"use server"

import { createClient } from "@/lib/supabase/server"

interface LegacyTopicsRow {
  topics: { name: string; category: string | null } | null
}

export async function getImageAnalysis(imageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ocr: null, topics: [], references: [] }
  }

  const { data: image } = await supabase
    .from("congress_images")
    .select("id")
    .eq("id", imageId)
    .eq("user_id", user.id)
    .single()

  if (!image) {
    return { ocr: null, topics: [], references: [] }
  }

  const [ocrResponse, referencesResponse, topicsJoinResponse] = await Promise.all([
    supabase
      .from("ocr_results")
      .select("cleaned_text")
      .eq("image_id", imageId)
      .single(),
    supabase
      .from("reference_candidates")
      .select(
        "raw_reference_text, detected_title, detected_authors, detected_year, detected_journal, verification_status, confidence_score"
      )
      .eq("image_id", imageId),
    supabase
      .from("image_topics")
      .select("topics(name, category)")
      .eq("image_id", imageId),
  ])

  const topics =
    (topicsJoinResponse.data as LegacyTopicsRow[] | null)
      ?.map((row) => row.topics)
      .filter((t): t is { name: string; category: string | null } => Boolean(t)) ?? []

  const references =
    referencesResponse.data?.map((ref) => ({
      raw_text: ref.raw_reference_text,
      detected_title: ref.detected_title,
      detected_authors: ref.detected_authors,
      detected_year: ref.detected_year,
      detected_journal: ref.detected_journal,
      verification_status: ref.verification_status,
      confidence_score: ref.confidence_score,
    })) ?? []

  return {
    ocr: ocrResponse.data?.cleaned_text ?? null,
    topics,
    references,
  }
}
