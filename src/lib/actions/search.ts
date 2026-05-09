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
  rank: number
}

interface RpcRow {
  image_id: string
  cleaned_text: string
  rank: number
}

interface ImageDetail {
  id: string
  original_filename: string
  storage_path_thumbnail: string | null
  congress_id: string
  congresses: { name: string; specialty: string | null } | null
}

/**
 * Global OCR search backed by Postgres FTS (tsvector + GIN).
 * Replaces the previous ilike approach: orders of magnitude faster on >1k rows.
 */
export async function searchGlobalOCR(
  term: string
): Promise<{ data?: SearchResult[]; error?: string }> {
  if (!term || term.trim().length < 3) return { data: [] }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  // 1) Run the indexed FTS query (RLS enforces user_id filter).
  const { data: hits, error: rpcError } = await supabase.rpc("search_ocr", {
    p_term: term.trim(),
    p_limit: 20,
  })

  if (rpcError) {
    console.error("Error en search_ocr:", rpcError)
    return { error: "Error al realizar la búsqueda" }
  }

  const rows = (hits ?? []) as RpcRow[]
  if (rows.length === 0) return { data: [] }

  // 2) Hydrate with image + congress metadata in one round-trip.
  const imageIds = rows.map((r) => r.image_id)
  const { data: images } = await supabase
    .from("congress_images")
    .select(
      "id, original_filename, storage_path_thumbnail, congress_id, congresses(name, specialty)"
    )
    .in("id", imageIds)

  const byId = new Map<string, ImageDetail>()
  for (const img of (images ?? []) as unknown as ImageDetail[]) {
    byId.set(img.id, img)
  }

  const results: SearchResult[] = rows
    .map((r) => {
      const img = byId.get(r.image_id)
      if (!img) return null
      return {
        image_id: r.image_id,
        cleaned_text: r.cleaned_text,
        rank: r.rank,
        original_filename: img.original_filename,
        congress_id: img.congress_id,
        congress_name: img.congresses?.name ?? "",
        storage_path_thumbnail: img.storage_path_thumbnail ?? "",
        specialty: img.congresses?.specialty ?? null,
      }
    })
    .filter((r): r is SearchResult => r !== null)

  return { data: results }
}
