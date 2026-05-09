"use server"

import { createClient } from "@/lib/supabase/server"

export interface LibraryReference {
  id: string
  congress_id: string
  congress_name: string
  image_id: string | null
  raw_text: string
  detected_title: string | null
  detected_authors: string | null
  detected_year: string | null
  detected_journal: string | null
  detected_doi: string | null
  verification_status: string
  confidence_score: number | null
  created_at: string
  specialty: string | null
}

interface ReferenceCandidateRow {
  id: string
  congress_id: string
  image_id: string | null
  raw_reference_text: string | null
  detected_title: string | null
  detected_authors: string | null
  detected_year: string | null
  detected_journal: string | null
  detected_doi: string | null
  verification_status: string
  confidence_score: number | null
  created_at: string
  congresses: {
    name: string
    specialty: string | null
  } | null
}

export async function getLibraryReferences(): Promise<{ data?: LibraryReference[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { data, error } = await supabase
    .from("reference_candidates")
    .select(`
      id,
      congress_id,
      image_id,
      raw_reference_text,
      detected_title,
      detected_authors,
      detected_year,
      detected_journal,
      detected_doi,
      verification_status,
      confidence_score,
      created_at,
      congresses (
        name,
        specialty
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error cargando biblioteca:", error)
    return { error: "No se pudo cargar la biblioteca de referencias" }
  }

  const rows = (data ?? []) as unknown as ReferenceCandidateRow[]

  const formatted: LibraryReference[] = rows.map((row) => ({
    id: row.id,
    congress_id: row.congress_id,
    congress_name: row.congresses?.name ?? "Desconocido",
    image_id: row.image_id,
    raw_text: row.raw_reference_text ?? "",
    detected_title: row.detected_title,
    detected_authors: row.detected_authors,
    detected_year: row.detected_year,
    detected_journal: row.detected_journal,
    detected_doi: row.detected_doi,
    verification_status: row.verification_status,
    confidence_score: row.confidence_score,
    created_at: row.created_at,
    specialty: row.congresses?.specialty ?? null,
  }))

  return { data: formatted }
}
