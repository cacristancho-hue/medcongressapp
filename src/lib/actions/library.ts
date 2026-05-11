"use server"

import { createClient } from "@/lib/supabase/server"

export interface LibraryReference {
  id: string
  congress_id: string
  congress_name: string
  image_id: string | null
  image_url: string | null
  raw_text: string
  detected_title: string | null
  detected_authors: string | null
  detected_year: string | null
  detected_journal: string | null
  detected_doi: string | null
  detected_pmid: string | null
  verification_status: string
  confidence_score: number | null
  created_at: string
  specialty: string | null
  // Nuevos campos
  official_title: string | null
  official_authors: string | null
  official_year: string | null
  official_journal: string | null
  abstract: string | null
  publication_type: string | null
  mesh_terms: string[] | null
  detection_count: number
  // Métricas de impacto
  citation_count: number | null
  influential_citation_count: number | null
  is_open_access: boolean
  open_access_url: string | null
}

interface ReferenceCandidateRow {
  id: string
  congress_id: string
  image_id: string | null
  master_id: string | null
  raw_reference_text: string | null
  detected_title: string | null
  detected_authors: string | null
  detected_year: string | null
  detected_journal: string | null
  detected_doi: string | null
  detected_pmid: string | null
  verification_status: string
  confidence_score: number | null
  created_at: string
  official_title: string | null
  official_authors: string | null
  official_year: string | null
  official_journal: string | null
  abstract: string | null
  publication_type: string | null
  mesh_terms: string[] | null
  citation_count: number | null
  influential_citation_count: number | null
  is_open_access: boolean
  open_access_url: string | null
  congresses: {
    name: string
    specialty: string | null
  } | null
}

export async function getLibraryReferences(): Promise<{ data?: LibraryReference[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  // 1. Obtener todas las referencias activas del usuario
  // Filtramos por congresses activos y congress_images activas
  const { data, error } = await supabase
    .from("reference_candidates")
    .select(`
      id,
      congress_id,
      image_id,
      master_id,
      raw_reference_text,
      detected_title,
      detected_authors,
      detected_year,
      detected_journal,
      detected_doi,
      detected_pmid,
      verification_status,
      confidence_score,
      created_at,
      official_title,
      official_authors,
      official_year,
      official_journal,
      abstract,
      publication_type,
      mesh_terms,
      citation_count,
      influential_citation_count,
      is_open_access,
      open_access_url,
      congresses!inner (
        name,
        specialty,
        deleted_at
      ),
      congress_images (
        deleted_at,
        storage_path_thumbnail
      )
    `)
    .is("deleted_at", null)
    .is("congresses.deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error cargando biblioteca:", error)
    return { error: "No se pudo cargar la biblioteca." }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  // Filtrar en memoria las referencias cuyas imágenes asociadas estén borradas
  const activeRows = (data ?? []).filter((row: any) => {
    // Si no tiene imagen_id (ej. agregada manualmente), es válida
    if (!row.image_id) return true
    // Si tiene imagen, debe no estar borrada
    return row.congress_images === null || row.congress_images.deleted_at === null
  })

  const rows = activeRows as unknown as any[]
  
  // 2. Motor de Deduplicación Top Mundial (In-Memory + Master Linkage)
  const libraryMap = new Map<string, LibraryReference>()

  rows.forEach((row) => {
    // Generar una clave única: Master ID > DOI > PMID > Título normalizado
    const masterId = row.master_id
    const doi = row.detected_doi?.toLowerCase().trim()
    const pmid = row.detected_pmid
    
    // Normalización de título mejorada (fuzzy)
    const normalizedTitle = row.detected_title
      ?.toLowerCase()
      .trim()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/[^a-z0-9]/g, "") // Solo alfanumérico
      .slice(0, 100) // Limitar longitud para evitar colisiones raras
    
    const key = masterId || doi || pmid || normalizedTitle || row.id

    // --- MOTOR DE DEPURACIÓN ÉLITE (AJUSTADO) ---
    // 1. Filtrar ruido extremo: Solo si no hay título, no hay DOI, y la confianza es casi nula (< 0.20)
    const isExtremeNoise = (row.confidence_score ?? 0) < 0.20
    const hasNoIdentity = !row.official_title && !row.detected_title && !row.detected_doi && !row.detected_pmid
    
    if (hasNoIdentity && isExtremeNoise) {
      return // Ignorar basura de OCR
    }

    // 2. Filtrar fragmentos absurdamente cortos ( < 12 chars ej. "p < 0.05")
    if (hasNoIdentity && (row.raw_reference_text?.length ?? 0) < 12) {
      return 
    }

    const current: LibraryReference = {
      id: row.id,
      congress_id: row.congress_id,
      congress_name: row.congresses?.name || "Material General",
      image_id: row.image_id,
      image_url: row.congress_images?.storage_path_thumbnail 
        ? `${supabaseUrl}/storage/v1/object/public/congress-photos/${row.congress_images.storage_path_thumbnail}`
        : null,
      raw_text: row.raw_reference_text ?? "",
      detected_title: row.detected_title,
      detected_authors: row.detected_authors,
      detected_year: row.detected_year,
      detected_journal: row.detected_journal,
      detected_doi: row.detected_doi,
      detected_pmid: row.detected_pmid,
      verification_status: row.verification_status,
      confidence_score: row.confidence_score,
      created_at: row.created_at,
      specialty: row.congresses?.specialty ?? null,
      official_title: row.official_title ?? row.detected_title,
      official_authors: row.official_authors ?? row.detected_authors,
      official_year: row.official_year ?? row.detected_year,
      official_journal: row.official_journal ?? row.detected_journal,
      abstract: row.abstract ?? null,
      publication_type: row.publication_type ?? null,
      mesh_terms: row.mesh_terms ?? null,
      detection_count: 1,
      citation_count: row.citation_count ?? null,
      influential_citation_count: row.influential_citation_count ?? null,
      is_open_access: row.is_open_access ?? false,
      open_access_url: row.open_access_url ?? null,
    }

    if (!existing) {
      libraryMap.set(key, current)
    } else {
      // Consolidación inteligente:
      // 1. Aumentar contador de detecciones
      existing.detection_count += 1
      
      // 2. Acumular nombres de congresos (si son distintos)
      if (!existing.congress_name.includes(current.congress_name)) {
        existing.congress_name += `, ${current.congress_name}`
      }

      // 3. Priorizar la entrada con mejor estatus de verificación o metadatos
      const statusPriority = { retracted: 4, verified: 3, partially_verified: 2, ambiguous: 1, not_verified: 0 }
      const currentPrio = statusPriority[current.verification_status as keyof typeof statusPriority] || 0
      const existingPrio = statusPriority[existing.verification_status as keyof typeof statusPriority] || 0

      if (currentPrio > existingPrio || (!existing.official_title && current.official_title)) {
        // Transferir metadatos superiores pero mantener el contador y congresos acumulados
        const savedCount = existing.detection_count
        const savedCongresses = existing.congress_name
        Object.assign(existing, current)
        existing.detection_count = savedCount
        existing.congress_name = savedCongresses
      }
    }
  })

  return { data: Array.from(libraryMap.values()) }
}
