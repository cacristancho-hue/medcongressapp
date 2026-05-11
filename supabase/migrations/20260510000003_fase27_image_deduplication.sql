-- MedCongress AI Companion - Fase 27
-- Prevención de Duplicados vía Hashing de Archivos

-- 1. Añadir columna de hash a las imágenes
alter table public.congress_images
  add column if not exists file_hash text;

-- 2. Índice único para evitar que el mismo archivo se suba dos veces AL MISMO CONGRESO
-- (Un mismo archivo puede estar en diferentes congresos, pero no repetido en uno solo)
create unique index if not exists ui_congress_images_hash_per_congress
  on public.congress_images(congress_id, file_hash)
  where file_hash is not null;

create index if not exists idx_congress_images_hash on public.congress_images(file_hash);
