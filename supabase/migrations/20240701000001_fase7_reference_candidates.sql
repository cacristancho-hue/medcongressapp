-- MedCongress AI Companion - Fase 7
-- Referencias candidatas detectadas por OCR/IA.
-- public.references queda como tabla legacy/deprecated por ahora.
-- Ejecutar despues de schema_fase6_images.sql.

create table if not exists public.reference_candidates (
  id                    uuid primary key default gen_random_uuid(),
  congress_id           uuid not null references public.congresses(id) on delete cascade,
  image_id              uuid references public.congress_images(id) on delete set null,
  user_id               uuid not null references auth.users(id) on delete cascade,
  raw_reference_text    text not null,
  detected_title        text,
  detected_authors      text,
  detected_year         text,
  detected_journal      text,
  detected_doi          text,
  detected_pmid         text,
  confidence_score      double precision,
  verification_status   text not null default 'not_verified'
                        check (verification_status in ('verified','partially_verified','not_verified','ambiguous')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.reference_candidates
  add column if not exists congress_id uuid references public.congresses(id) on delete cascade;

alter table public.reference_candidates
  add column if not exists image_id uuid references public.congress_images(id) on delete set null;

alter table public.reference_candidates
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.reference_candidates
  add column if not exists raw_reference_text text;

alter table public.reference_candidates
  add column if not exists detected_title text;

alter table public.reference_candidates
  add column if not exists detected_authors text;

alter table public.reference_candidates
  add column if not exists detected_year text;

alter table public.reference_candidates
  add column if not exists detected_journal text;

alter table public.reference_candidates
  add column if not exists detected_doi text;

alter table public.reference_candidates
  add column if not exists detected_pmid text;

alter table public.reference_candidates
  add column if not exists confidence_score double precision;

alter table public.reference_candidates
  add column if not exists verification_status text default 'not_verified';

alter table public.reference_candidates
  add column if not exists created_at timestamptz not null default now();

alter table public.reference_candidates
  add column if not exists updated_at timestamptz not null default now();

alter table public.reference_candidates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reference_candidates'
      and policyname = 'reference_candidates: user select own'
  ) then
    create policy "reference_candidates: user select own"
      on public.reference_candidates for select
      using (
        auth.uid() = user_id
        and exists (
          select 1 from public.congresses
          where congresses.id = reference_candidates.congress_id
            and congresses.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reference_candidates'
      and policyname = 'reference_candidates: user insert own'
  ) then
    create policy "reference_candidates: user insert own"
      on public.reference_candidates for insert
      with check (
        auth.uid() = user_id
        and exists (
          select 1 from public.congresses
          where congresses.id = reference_candidates.congress_id
            and congresses.user_id = auth.uid()
        )
        and (
          image_id is null
          or exists (
            select 1 from public.congress_images
            where congress_images.id = reference_candidates.image_id
              and congress_images.congress_id = reference_candidates.congress_id
              and congress_images.user_id = auth.uid()
          )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reference_candidates'
      and policyname = 'reference_candidates: user update own'
  ) then
    create policy "reference_candidates: user update own"
      on public.reference_candidates for update
      using (
        auth.uid() = user_id
        and exists (
          select 1 from public.congresses
          where congresses.id = reference_candidates.congress_id
            and congresses.user_id = auth.uid()
        )
      )
      with check (
        auth.uid() = user_id
        and exists (
          select 1 from public.congresses
          where congresses.id = reference_candidates.congress_id
            and congresses.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reference_candidates'
      and policyname = 'reference_candidates: user delete own'
  ) then
    create policy "reference_candidates: user delete own"
      on public.reference_candidates for delete
      using (
        auth.uid() = user_id
        and exists (
          select 1 from public.congresses
          where congresses.id = reference_candidates.congress_id
            and congresses.user_id = auth.uid()
        )
      );
  end if;
end $$;

create index if not exists idx_reference_candidates_congress_id
  on public.reference_candidates(congress_id);

create index if not exists idx_reference_candidates_image_id
  on public.reference_candidates(image_id);

create index if not exists idx_reference_candidates_user_id
  on public.reference_candidates(user_id);

create index if not exists idx_reference_candidates_verification_status
  on public.reference_candidates(verification_status);

create index if not exists idx_reference_candidates_detected_pmid
  on public.reference_candidates(detected_pmid)
  where detected_pmid is not null;
