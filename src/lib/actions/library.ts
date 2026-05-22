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
  official_title: string | null
  official_authors: string | null
  official_year: string | null
  official_journal: string | null
  abstract: string | null
  publication_type: string | null
  mesh_terms: string[] | null
  verification_notes: string | null
  detection_count: number
  citation_count: number | null
  influential_citation_count: number | null
  is_open_access: boolean
  open_access_url: string | null
  image_full_url: string | null
  clinical_tags: string[] | null
  is_favorite: boolean
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
  verification_notes: string | null
  citation_count: number | null
  influential_citation_count: number | null
  is_open_access: boolean
  open_access_url: string | null
  congresses: {
    name: string
    specialty: string | null
  } | null
  congress_images: {
    deleted_at: string | null
    storage_path: string | null
    storage_path_thumbnail: string | null
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
      verification_notes,
      citation_count,
      influential_citation_count,
      is_open_access,
      open_access_url,
      clinical_tags,
      is_favorite,
      congresses!inner (
        name,
        specialty,
        deleted_at
      ),
      congress_images (
        deleted_at,
        storage_path,
        storage_path_thumbnail
      )
    `)
    .is("congresses.deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error cargando biblioteca:", error)
    return { error: "No se pudo cargar la biblioteca." }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  type LibraryQueryRow = {
    id: string
    congress_id: string
    image_id: string | null
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
    verification_notes: string | null
    citation_count: number | null
    influential_citation_count: number | null
    is_open_access: boolean | null
    open_access_url: string | null
    clinical_tags: string[] | null
    is_favorite: boolean | null
    congress_images: { deleted_at: string | null; storage_path_thumbnail: string | null; storage_path: string | null } | null
    congresses: { name: string | null; specialty: string | null; deleted_at: string | null } | null
  }

  const activeRows = ((data ?? []) as unknown as LibraryQueryRow[]).filter((row) => {
    if (!row.image_id || !row.congress_images || row.congress_images.deleted_at !== null) {
      return false
    }
    return true
  })

  const libraryRows: LibraryReference[] = []

  activeRows.forEach((row) => {
    const isExtremeNoise = (row.confidence_score ?? 0) < 0.2
    const hasNoIdentity = !row.official_title && !row.detected_title && !row.detected_doi && !row.detected_pmid

    if (hasNoIdentity && isExtremeNoise) return
    if (hasNoIdentity && (row.raw_reference_text?.length ?? 0) < 12) return

    libraryRows.push({
      id: row.id,
      congress_id: row.congress_id,
      congress_name: row.congresses?.name || "Material General",
      image_id: row.image_id,
      image_url: row.congress_images?.storage_path_thumbnail
        ? `${supabaseUrl}/storage/v1/object/public/congress-photos/${row.congress_images.storage_path_thumbnail}`
        : null,
      image_full_url: row.congress_images?.storage_path
        ? `${supabaseUrl}/storage/v1/object/public/congress-photos/${row.congress_images.storage_path}`
        : row.congress_images?.storage_path_thumbnail
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
      verification_notes: row.verification_notes ?? null,
      detection_count: 1,
      citation_count: row.citation_count ?? null,
      influential_citation_count: row.influential_citation_count ?? null,
      is_open_access: row.is_open_access ?? false,
      open_access_url: row.open_access_url ?? null,
      clinical_tags: row.clinical_tags ?? null,
      is_favorite: row.is_favorite ?? false,
    })
  })

  return { data: libraryRows }
}
