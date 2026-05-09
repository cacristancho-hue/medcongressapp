"use server"

import { createClient } from "@/lib/supabase/server"

export interface SearchResult {
  image_id: string
  original_filename: string
  congress_id: string
  congress_name: string
  cleaned_text: string
  storage_path_thumbnail: string
  specialty: string | null
}

interface SupabaseSearchRow {
  image_id: string
  cleaned_text: string
  congress_images: {
    original_filename: string
    storage_path_thumbnail: string
    congress_id: string
    user_id: string
    congresses: {
      name: string
      specialty: string | null
    }
  }
}

/**
 * Realiza una búsqueda global en todos los resultados de OCR del usuario.
 */
export async function searchGlobalOCR(term: string): Promise<{ data?: SearchResult[]; error?: string }> {
  if (!term || term.length < 3) return { data: [] }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { data, error } = await supabase
    .from("ocr_results")
    .select(`
      image_id,
      cleaned_text,
      congress_images!inner (
        original_filename,
        storage_path_thumbnail,
        congress_id,
        user_id,
        congresses (
          name,
          specialty
        )
      )
    `)
    .ilike("cleaned_text", `%${term}%`)
    .eq("congress_images.user_id", user.id)
    .limit(20)

  if (error) {
    console.error("Error en búsqueda global:", error)
    return { error: "Error al realizar la búsqueda" }
  }

  const rawData = data as unknown as SupabaseSearchRow[]

  const results: SearchResult[] = rawData.map((row) => ({
    image_id: row.image_id,
    original_filename: row.congress_images.original_filename,
    congress_id: row.congress_images.congress_id,
    congress_name: row.congress_images.congresses.name,
    cleaned_text: row.cleaned_text,
    storage_path_thumbnail: row.congress_images.storage_path_thumbnail,
    specialty: row.congress_images.congresses.specialty
  }))

  return { data: results }
}
