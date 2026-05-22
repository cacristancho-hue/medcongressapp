-- MedCongress - Fase 34: convertir la biblioteca de referencias en una base de
-- conocimiento consultable — tags clínicos definidos por el usuario + favoritos.
--
-- Distinto de mesh_terms (que son términos MeSH automáticos de la verificación):
-- clinical_tags los pone el médico para organizar su biblioteca a su manera.
-- Aditiva, no destructiva. Idempotente.

alter table public.reference_candidates
  add column if not exists clinical_tags text[],
  add column if not exists is_favorite boolean not null default false;

comment on column public.reference_candidates.clinical_tags is
  'Etiquetas clínicas definidas por el usuario para organizar la biblioteca (no MeSH).';
comment on column public.reference_candidates.is_favorite is
  'Marca de favorito del usuario en la biblioteca.';

-- GIN para filtrar por tag de forma eficiente.
create index if not exists idx_reference_candidates_clinical_tags
  on public.reference_candidates using gin (clinical_tags);

-- Índice parcial para listar favoritos rápido.
create index if not exists idx_reference_candidates_is_favorite
  on public.reference_candidates(user_id)
  where is_favorite = true;
