-- MedCongress AI Companion - Fase 6 Images
-- Compression, thumbnails, and upload metadata
-- Execute in: Supabase SQL Editor

alter table public.congress_images
  add column if not exists storage_path_optimized text,
  add column if not exists storage_path_thumbnail text,
  add column if not exists width_original integer,
  add column if not exists height_original integer,
  add column if not exists width_optimized integer,
  add column if not exists height_optimized integer,
  add column if not exists width_thumbnail integer,
  add column if not exists height_thumbnail integer,
  add column if not exists size_original_bytes bigint,
  add column if not exists size_optimized_bytes bigint,
  add column if not exists size_thumbnail_bytes bigint,
  add column if not exists compression_quality numeric(4,2),
  add column if not exists compression_ratio numeric(8,4),
  add column if not exists mime_type_original text,
  add column if not exists mime_type_optimized text,
  add column if not exists mime_type_thumbnail text,
  add column if not exists upload_status text not null default 'uploaded',
  add column if not exists external_sync_status text not null default 'not_configured',
  add column if not exists ocr_status text not null default 'pending',
  add column if not exists ai_status text not null default 'pending',
  add column if not exists upload_error text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_congress_images_user_congress
  on public.congress_images(user_id, congress_id, created_at desc);

create index if not exists idx_congress_images_upload_status
  on public.congress_images(upload_status);

create index if not exists idx_congress_images_external_sync_status
  on public.congress_images(external_sync_status);

create index if not exists idx_congress_images_ocr_status
  on public.congress_images(ocr_status);

create index if not exists idx_congress_images_ai_status
  on public.congress_images(ai_status);
