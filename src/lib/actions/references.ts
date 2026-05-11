"use server"

import { revalidatePath } from "next/cache"
import { verifyReference, ReferenceInput } from "@/lib/reference-verification"
import { withAction } from "@/lib/with-action"

interface CandidateRow {
  id: string
  raw_reference_text: string
  detected_title: string | null
  detected_authors: string | null
  detected_year: string | null
  detected_journal: string | null
  detected_doi: string | null
}

function toInput(row: CandidateRow): ReferenceInput {
  return {
    id: row.id,
    raw_text: row.raw_reference_text,
    detected_title: row.detected_title,
    detected_authors: row.detected_authors,
    detected_year: row.detected_year,
    detected_journal: row.detected_journal,
    detected_doi: row.detected_doi,
  }
}

interface VerifySingleInput {
  referenceId: string
  congressId: string
}

export const verifySingleReference = withAction({
  name: "reference.verify",
  rateLimit: "reference_verify",
})(async ({ user, supabase }, input: VerifySingleInput) => {
  const { referenceId, congressId } = input

  const { data: ref, error: fetchError } = await supabase
    .from("reference_candidates")
    .select(
      "id, raw_reference_text, detected_title, detected_authors, detected_year, detected_journal, detected_doi, congress_id, user_id"
    )
    .eq("id", referenceId)
    .single()

  if (fetchError || !ref) throw new Error("Referencia no encontrada")
  if (ref.user_id !== user.id || ref.congress_id !== congressId) {
    throw new Error("No autorizado")
  }

  const result = await verifyReference(toInput(ref))

  const { error: updateError } = await supabase
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
      official_title: result.matchedTitle,
      official_authors: result.matchedAuthors,
      official_year: result.matchedYear,
      official_journal: result.matchedJournal,
      abstract: result.abstract,
      publication_type: result.publicationType,
      mesh_terms: result.meshTerms,
    })
    .eq("id", referenceId)

  if (updateError) throw new Error("Error al actualizar la referencia")

  revalidatePath(`/dashboard/congresos/${congressId}`)
  return { data: result }
})

export const verifyCongressReferences = withAction({
  name: "reference.verify",
  rateLimit: "reference_verify",
})(async ({ user, supabase }, congressId: string) => {
  const { data: refs, error } = await supabase
    .from("reference_candidates")
    .select(
      "id, raw_reference_text, detected_title, detected_authors, detected_year, detected_journal, detected_doi"
    )
    .eq("congress_id", congressId)
    .eq("user_id", user.id)
    .neq("verification_status", "verified")
    .neq("verification_status", "retracted")

  if (error) throw new Error("Error al cargar las referencias")
  if (!refs?.length) return { processed: 0, retracted: 0 }

  let processed = 0
  let retracted = 0

  for (const ref of refs) {
    try {
      const result = await verifyReference(toInput(ref))

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
          official_title: result.matchedTitle,
          official_authors: result.matchedAuthors,
          official_year: result.matchedYear,
          official_journal: result.matchedJournal,
          abstract: result.abstract,
          publication_type: result.publicationType,
          mesh_terms: result.meshTerms,
        })
        .eq("id", ref.id)

      processed++
      if (result.retracted) retracted++

      await new Promise((resolve) => setTimeout(resolve, 350))
    } catch (err) {
      console.error(`Error verificando referencia ${ref.id}:`, err)
    }
  }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  return { processed, retracted }
})
