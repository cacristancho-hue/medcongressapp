-- MedCongress - Fase 36: tipo de contenido de la imagen.
--
-- La IA clasifica cada imagen (texto, tabla, grafica, imagen_medica, algoritmo,
-- poster, foto_clinica, otro) para adaptar el análisis y permitir filtrar la
-- galería por tipo. Aditiva, no destructiva. Idempotente.

alter table public.ocr_results
  add column if not exists image_type text;

comment on column public.ocr_results.image_type is
  'Tipo de contenido de la imagen clasificado por IA: texto|tabla|grafica|imagen_medica|algoritmo|poster|foto_clinica|otro.';
