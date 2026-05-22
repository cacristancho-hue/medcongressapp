-- MedCongress - Fase 35: texto de diapositiva depurado de citas.
--
-- `slide_text` guarda el contenido textual de la diapositiva SIN el aparato
-- bibliográfico (títulos de artículos citados, listas de autores, journals,
-- DOIs/PMIDs, años y números de cita). Lo produce la IA, que distingue contenido
-- de referencia mejor que cualquier heurística. Se muestra en el visor.
--
-- raw_text (literal completo) se conserva para export/verificación.
-- Aditiva, no destructiva. Idempotente.

alter table public.ocr_results
  add column if not exists slide_text text;

comment on column public.ocr_results.slide_text is
  'Contenido textual de la diapositiva depurado de citas/referencias (generado por IA). Para mostrar al usuario.';
