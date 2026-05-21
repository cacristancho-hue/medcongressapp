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

  const { data: imageData } = await supabase
    .from("congress_images")
    .select("id, storage_path, storage_path_optimized, status")
    .eq("id", imageId)
    .eq("user_id", user.id)
    .single()

  if (!imageData) {
    return { ocr: null, topics: [], references: [] }
  }

  // Generar URL firmada fresca para la versión optimizada
  const { data: signed } = await supabase.storage
    .from("congress-photos")
    .createSignedUrl(imageData.storage_path_optimized || imageData.storage_path, 3600)

  const [ocrResponse, referencesResponse, topicsJoinResponse] = await Promise.all([
    supabase
      .from("ocr_results")
      .select("raw_text, cleaned_text, medical_summary")
      .eq("image_id", imageId)
      .single(),
    supabase
      .from("reference_candidates")
      .select(
        "id, raw_reference_text, detected_title, detected_authors, detected_year, detected_journal, verification_status, confidence_score, detected_doi, detected_pmid, is_open_access, open_access_url, citation_count, official_title, official_authors, official_year, official_journal, verification_notes"
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
      detected_doi: ref.detected_doi,
      detected_pmid: ref.detected_pmid,
      is_open_access: ref.is_open_access,
      open_access_url: ref.open_access_url,
      citation_count: ref.citation_count,
      official_title: ref.official_title,
      official_authors: ref.official_authors,
      official_year: ref.official_year,
      official_journal: ref.official_journal,
      verification_notes: ref.verification_notes,
    })) ?? []

  // ocr = literal extracted text (raw_text); summary = AI inference, kept
  // separate so the UI can label provenance honestly. Legacy fallback.
  return {
    ocr: ocrResponse.data?.raw_text ?? ocrResponse.data?.cleaned_text ?? null,
    summary: ocrResponse.data?.medical_summary ?? null,
    topics,
    references,
    optimizedSignedUrl: signed?.signedUrl ?? null,
    status: imageData.status
  }
}
