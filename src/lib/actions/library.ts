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

/**
 * Obtiene todas las referencias bibliográficas del usuario para la biblioteca.
 */
export async function getLibraryReferences(): Promise<{ data?: LibraryReference[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  // Intentamos primero con 'reference_candidates' (estructura nueva)
  // Si falla, es que el usuario sigue usando 'references' (estructura legacy)
  const { data, error } = await supabase
    .from("reference_candidates")
    .select(`
      *,
      congresses (
        name,
        specialty
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    // Reintento con tabla 'references' si la anterior no existe
    const { data: legacyData, error: legacyError } = await supabase
      .from("references")
      .select(`
        *,
        congresses (
          name,
          specialty
        )
      `)
      .order("created_at", { ascending: false })

    if (legacyError) {
      console.error("Error cargando biblioteca:", legacyError)
      return { error: "No se pudo cargar la biblioteca de referencias" }
    }

    return { data: formatRows(legacyData) }
  }

  return { data: formatRows(data) }
}

interface SupabaseReferenceRow {
  id: string
  congress_id: string
  image_id: string | null
  raw_text?: string
  raw_reference_text?: string
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

function formatRows(rows: SupabaseReferenceRow[]): LibraryReference[] {
  return rows.map(row => ({
    id: row.id,
    congress_id: row.congress_id,
    congress_name: row.congresses?.name || "Desconocido",
    image_id: row.image_id,
    raw_text: row.raw_text || row.raw_reference_text || "",
    detected_title: row.detected_title,
    detected_authors: row.detected_authors,
    detected_year: row.detected_year,
    detected_journal: row.detected_journal,
    detected_doi: row.detected_doi,
    verification_status: row.verification_status,
    confidence_score: row.confidence_score,
    created_at: row.created_at,
    specialty: row.congresses?.specialty || null
  }))
}
