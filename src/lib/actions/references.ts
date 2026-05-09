"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { verifyReferenceWithOpenAlex, ReferenceInput } from "@/lib/reference-verification"

/**
 * Verifica una sola referencia candidata específica.
 */
export async function verifySingleReference(referenceId: string, congressId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { data: ref, error: fetchError } = await supabase
    .from("reference_candidates")
    .select("*")
    .eq("id", referenceId)
    .single()

  if (fetchError || !ref) return { error: "Referencia no encontrada" }

  const input: ReferenceInput = {
    id: ref.id,
    raw_text: ref.raw_reference_text,
    detected_title: ref.detected_title,
    detected_authors: ref.detected_authors,
    detected_year: ref.detected_year,
    detected_journal: ref.detected_journal,
    detected_doi: ref.detected_doi,
  }

  const result = await verifyReferenceWithOpenAlex(input)

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
    })
    .eq("id", referenceId)

  if (updateError) return { error: "Error al actualizar la referencia" }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  return { success: true, data: result }
}

/**
 * Verifica todas las referencias pendientes de un congreso.
 */
export async function verifyCongressReferences(congressId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  // 1. Obtener candidatos de referencia pendientes o no verificados
  const { data: refs, error } = await supabase
    .from("reference_candidates")
    .select("*")
    .eq("congress_id", congressId)
    .neq("verification_status", "verified")

  if (error) return { error: "Error al cargar las referencias" }
  if (!refs?.length) return { success: true }

  // 2. Procesar cada referencia de forma SECUENCIAL (Protección de Rate Limit)
  // No usamos Promise.all para evitar errores 429 en OpenAlex
  for (const ref of refs) {
    try {
      const input: ReferenceInput = {
        id: ref.id,
        raw_text: ref.raw_reference_text,
        detected_title: ref.detected_title,
        detected_authors: ref.detected_authors,
        detected_year: ref.detected_year,
        detected_journal: ref.detected_journal,
        detected_doi: ref.detected_doi,
      }
      
      const result = await verifyReferenceWithOpenAlex(input)
      
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
        })
        .eq("id", ref.id)

      // Pequeño retardo de 100ms para ser "educados" con la API (Polite Pool mindset)
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (err) {
      console.error(`Error verificando referencia ${ref.id}:`, err)
    }
  }

  revalidatePath(`/dashboard/congresos/${congressId}`)
  return { success: true }
}
