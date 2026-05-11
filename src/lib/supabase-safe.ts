import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Realiza un update resiliente en Supabase.
 * Si falla con el error 42703 (columna no existe), filtra las columnas que pertenecen
 * a las Fases 24-27 (aún no propagadas en algunos entornos) y reintenta.
 */
export async function safeUpdate(
  supabase: SupabaseClient<any>,
  table: string,
  payload: Record<string, any>,
  match: Record<string, any>
) {
  // Columnas introducidas en Fases 24, 25, 26 y 27
  const academicColumns = [
    'master_id', 
    'official_title', 
    'official_authors', 
    'official_year', 
    'official_journal', 
    'abstract', 
    'publication_type', 
    'mesh_terms',
    'citation_count',
    'influential_citation_count',
    'is_open_access',
    'open_access_url',
    'semantic_scholar_id',
    'last_synced_at',
    'file_hash'
  ]

  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .match(match)

  // Error 42703: undefined_column
  if (error && (error.code === '42703' || error.message?.includes('column'))) {
    console.warn(`[supabase-safe] Detectada columna inexistente en tabla '${table}'. Aplicando fallback académico...`)
    
    const safePayload = { ...payload }
    academicColumns.forEach(col => {
      delete safePayload[col]
    })

    return supabase
      .from(table)
      .update(safePayload)
      .match(match)
  }

  return { data, error }
}
