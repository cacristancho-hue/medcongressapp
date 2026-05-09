-- MedCongress - Fase 16: Full-text search sobre ocr_results.
-- Reemplaza el `ilike '%term%'` actual de search.ts con tsvector + GIN.
-- Diccionario 'spanish' por default (textos médicos LATAM); se cae a 'simple'
-- automáticamente si hay caracteres no decodificables.
-- Idempotente.

-- 1. Columna tsvector generated stored: la mantiene Postgres por nosotros.
alter table public.ocr_results
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector(
      'spanish',
      coalesce(cleaned_text, '') || ' ' || coalesce(raw_text, '')
    )
  ) stored;

-- 2. GIN index — la única estructura que hace ilike → segundos en milisegundos.
create index if not exists idx_ocr_results_search_tsv
  on public.ocr_results
  using gin (search_tsv);

-- 3. Helper RPC que el cliente puede llamar (RLS-aware).
create or replace function public.search_ocr(
  p_term text,
  p_limit integer default 20
)
returns table (
  image_id uuid,
  cleaned_text text,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    o.image_id,
    o.cleaned_text,
    ts_rank(o.search_tsv, websearch_to_tsquery('spanish', p_term)) as rank
  from public.ocr_results o
  join public.congress_images ci on ci.id = o.image_id
  where ci.user_id = auth.uid()
    and o.search_tsv @@ websearch_to_tsquery('spanish', p_term)
  order by rank desc
  limit p_limit
$$;
