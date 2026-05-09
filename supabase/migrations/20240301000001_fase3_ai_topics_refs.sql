-- MedCongress AI Companion – Fase 3 Schema
-- Inteligencia: OCR, Tópicos y Referencias
-- Ejecutar en: Supabase SQL Editor

-- ============================================================
-- OCR_RESULTS
-- ============================================================
create table if not exists public.ocr_results (
  id                uuid primary key default gen_random_uuid(),
  image_id          uuid not null references public.congress_images(id) on delete cascade,
  raw_text          text,
  cleaned_text      text,
  confidence_score  float,
  created_at        timestamptz not null default now(),
  unique(image_id)
);

alter table public.ocr_results enable row level security;

create policy "ocr_results: user select own"
  on public.ocr_results for select
  using (
    exists (
      select 1 from public.congress_images
      where id = ocr_results.image_id
      and user_id = auth.uid()
    )
  );

create policy "ocr_results: user insert own"
  on public.ocr_results for insert
  with check (
    exists (
      select 1 from public.congress_images
      where id = ocr_results.image_id
      and user_id = auth.uid()
    )
  );

create policy "ocr_results: user update own"
  on public.ocr_results for update
  using (
    exists (
      select 1 from public.congress_images
      where id = ocr_results.image_id
      and user_id = auth.uid()
    )
  );

-- ============================================================
-- TOPICS
-- ============================================================
create table if not exists public.topics (
  id                uuid primary key default gen_random_uuid(),
  congress_id       uuid not null references public.congresses(id) on delete cascade,
  name              text not null,
  category          text, -- e.g., 'Metodología', 'Tratamiento', 'Diagnóstico'
  description       text,
  created_at        timestamptz not null default now()
);

alter table public.topics enable row level security;

create policy "topics: user select own"
  on public.topics for select
  using (
    exists (
      select 1 from public.congresses
      where id = topics.congress_id
      and user_id = auth.uid()
    )
  );

create policy "topics: user insert own"
  on public.topics for insert
  with check (
    exists (
      select 1 from public.congresses
      where id = topics.congress_id
      and user_id = auth.uid()
    )
  );

create policy "topics: user update own"
  on public.topics for update
  using (
    exists (
      select 1 from public.congresses
      where id = topics.congress_id
      and user_id = auth.uid()
    )
  );

-- Relación N:M entre Imágenes y Tópicos (una foto puede tratar varios temas)
create table if not exists public.image_topics (
  image_id uuid not null references public.congress_images(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary key (image_id, topic_id)
);

alter table public.image_topics enable row level security;

create policy "image_topics: user select own"
  on public.image_topics for select
  using (
    exists (
      select 1 from public.congress_images
      where id = image_topics.image_id
      and user_id = auth.uid()
    )
  );

create policy "image_topics: user insert own"
  on public.image_topics for insert
  with check (
    exists (
      select 1 from public.congress_images
      where id = image_topics.image_id
      and user_id = auth.uid()
    )
  );

create policy "image_topics: user update own"
  on public.image_topics for update
  using (
    exists (
      select 1 from public.congress_images
      where id = image_topics.image_id
      and user_id = auth.uid()
    )
  );

-- ============================================================
-- BIBLIOGRAPHIC REFERENCES
-- ============================================================
create table if not exists public.references (
  id                uuid primary key default gen_random_uuid(),
  congress_id       uuid not null references public.congresses(id) on delete cascade,
  image_id          uuid references public.congress_images(id) on delete set null,
  raw_text          text not null,
  detected_title    text,
  detected_authors  text,
  detected_year     text,
  detected_journal  text,
  detected_doi      text,
  verification_status text default 'not_verified' 
                    check (verification_status in ('verified','partially_verified','not_verified','ambiguous')),
  created_at        timestamptz not null default now()
);

alter table public.references enable row level security;

create policy "references: user select own"
  on public.references for select
  using (
    exists (
      select 1 from public.congresses
      where id = "references".congress_id
      and user_id = auth.uid()
    )
  );

create policy "references: user insert own"
  on public.references for insert
  with check (
    exists (
      select 1 from public.congresses
      where id = "references".congress_id
      and user_id = auth.uid()
    )
  );

create policy "references: user update own"
  on public.references for update
  using (
    exists (
      select 1 from public.congresses
      where id = "references".congress_id
      and user_id = auth.uid()
    )
  );

-- Índices de rendimiento
create index if not exists idx_ocr_results_image_id on public.ocr_results(image_id);
create index if not exists idx_image_topics_image_id on public.image_topics(image_id);
create index if not exists idx_references_congress_id on public.references(congress_id);
