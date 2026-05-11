-- MedCongress AI Companion - Fase 24
-- Enriquecimiento académico: abstracts y metadatos profundos.
-- Soporte para deduplicación en la biblioteca.

alter table public.reference_candidates
  add column if not exists abstract text,
  add column if not exists official_title text,
  add column if not exists official_authors text,
  add column if not exists official_year text,
  add column if not exists official_journal text,
  add column if not exists mesh_terms text[],
  add column if not exists publication_type text;

-- Columna para deduplicación: apunta a la referencia "maestra" (la primera veroficada con este DOI/PMID)
alter table public.reference_candidates
  add column if not exists master_id uuid references public.reference_candidates(id) on delete set null;

create index if not exists idx_reference_candidates_doi_pmid 
  on public.reference_candidates(detected_doi, detected_pmid)
  where detected_doi is not null or detected_pmid is not null;

create index if not exists idx_reference_candidates_master_id
  on public.reference_candidates(master_id)
  where master_id is not null;
