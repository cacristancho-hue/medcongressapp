-- MedCongress AI Companion – Fase 2 Schema
-- Subida de fotos por congreso
-- Ejecutar en: Supabase SQL Editor

-- ============================================================
-- CONGRESS_IMAGES
-- ============================================================
create table if not exists public.congress_images (
  id                uuid primary key default gen_random_uuid(),
  congress_id       uuid not null references public.congresses(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  storage_path      text not null unique,
  original_filename text not null,
  file_size         integer,
  mime_type         text,
  image_order       integer not null default 0,
  status            text not null default 'uploaded'
                    check (status in ('uploaded','processing','ocr_done','analyzed','failed','deleted_original')),
  created_at        timestamptz not null default now()
);

alter table public.congress_images enable row level security;

create policy "images: select own"
  on public.congress_images for select
  using (auth.uid() = user_id);

create policy "images: insert own"
  on public.congress_images for insert
  with check (auth.uid() = user_id);

create policy "images: update own"
  on public.congress_images for update
  using (auth.uid() = user_id);

create policy "images: delete own"
  on public.congress_images for delete
  using (auth.uid() = user_id);

create index if not exists idx_congress_images_congress_id
  on public.congress_images(congress_id);

create index if not exists idx_congress_images_user_id
  on public.congress_images(user_id);

-- ============================================================
-- STORAGE: bucket 'congress-photos' (privado)
-- Límite: 20 MB por archivo
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'congress-photos',
  'congress-photos',
  false,
  20971520,
  array['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do nothing;

-- Acceso por carpeta: {user_id}/{congress_id}/{uuid}.{ext}
create policy "storage: insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'congress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage: select own"
  on storage.objects for select
  using (
    bucket_id = 'congress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'congress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
