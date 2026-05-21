-- MedCongress - Fase 32: separación honesta OCR literal vs síntesis IA.
--
-- Contexto: hasta fase31, la columna `ocr_results.cleaned_text` se usaba para
-- almacenar el `medical_summary` (INFERENCIA de IA), no OCR limpio. Todo el
-- downstream (reportes, búsqueda, tópicos, export, métricas) leía esa columna
-- creyendo que era texto extraído. Eso viola el principio de trazabilidad
-- "extraído vs inferido" del producto.
--
-- Esta migración:
--   1. Añade `medical_summary` para guardar la inferencia de forma honesta.
--   2. Recupera (backfill) las síntesis previas que vivían en `cleaned_text`.
--   3. Recrea `search_ocr` para devolver `raw_text` (OCR literal) como snippet.
--
-- NO destructiva: no borra ni sobrescribe `cleaned_text` ni `raw_text`.
-- Idempotente.

-- 1. Columna para la síntesis IA (inferencia), separada del OCR.
alter table public.ocr_results
  add column if not exists medical_summary text;

comment on column public.ocr_results.medical_summary is
  'Síntesis médica generada por IA (INFERENCIA). No es texto literal extraído.';
comment on column public.ocr_results.raw_text is
  'Texto literal extraído de la imagen (OCR). Fuente de verdad para búsqueda/tópicos.';
comment on column public.ocr_results.cleaned_text is
  'OCR limpio. Histórico: en filas <= fase31 puede contener la síntesis IA (migrada a medical_summary).';

-- 2. Backfill: recupera las síntesis que estaban mal ubicadas en cleaned_text.
--    Solo donde aún no hay medical_summary, para ser idempotente y no pisar datos nuevos.
update public.ocr_results
set medical_summary = cleaned_text
where medical_summary is null
  and cleaned_text is not null;

-- 3. search_ocr ahora devuelve OCR literal (raw_text) como snippet, no la síntesis.
--    El tsvector generado ya indexa raw_text, así que la búsqueda no pierde cobertura.
--    Cambia la firma de columnas de retorno => hay que DROP antes de recrear.
drop function if exists public.search_ocr(text, integer);

create function public.search_ocr(
  p_term text,
  p_limit integer default 20
)
returns table (
  image_id uuid,
  ocr_text text,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    o.image_id,
    coalesce(o.raw_text, o.cleaned_text) as ocr_text,
    ts_rank(o.search_tsv, websearch_to_tsquery('spanish', p_term)) as rank
  from public.ocr_results o
  join public.congress_images ci on ci.id = o.image_id
  where ci.user_id = auth.uid()
    and o.search_tsv @@ websearch_to_tsquery('spanish', p_term)
  order by rank desc
  limit p_limit
$$;
