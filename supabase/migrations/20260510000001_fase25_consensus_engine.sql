-- MedCongress AI Companion - Fase 25
-- Refuerzo de Metadatos y Motor de Consenso (Deduplicación Automática)

-- 1. Ampliación de metadatos académicos
alter table public.reference_candidates
  add column if not exists citation_count integer,
  add column if not exists influential_citation_count integer,
  add column if not exists is_open_access boolean default false,
  add column if not exists open_access_url text,
  add column if not exists semantic_scholar_id text,
  add column if not exists last_synced_at timestamptz;

-- 2. Función para encontrar o crear una Referencia Maestra
-- Esta función se usará para asegurar que múltiples avistamientos apunten al mismo 'master_id'
create or replace function public.find_or_create_master_reference()
returns trigger as $$
declare
  v_master_id uuid;
begin
  -- Solo buscar si tenemos un identificador fuerte (DOI o PMID)
  if new.detected_doi is not null or new.detected_pmid is not null then
    -- Buscar una referencia que ya sea maestra (master_id is null) para este usuario
    select id into v_master_id
      from public.reference_candidates
     where user_id = new.user_id
       and master_id is null
       and (
         (new.detected_doi is not null and detected_doi = new.detected_doi)
         or
         (new.detected_pmid is not null and detected_pmid = new.detected_pmid)
       )
     limit 1;

    -- Si encontramos una, la vinculamos
    if v_master_id is not null and v_master_id != new.id then
      new.master_id := v_master_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 3. Trigger para deduplicación automática al insertar o actualizar
drop trigger if exists trg_reference_deduplication on public.reference_candidates;
create trigger trg_reference_deduplication
  before insert or update of detected_doi, detected_pmid
  on public.reference_candidates
  for each row
  execute function public.find_or_create_master_reference();

-- 4. Índice para búsquedas rápidas de impacto
create index if not exists idx_references_impact 
  on public.reference_candidates(citation_count desc nulls last)
  where master_id is null;
