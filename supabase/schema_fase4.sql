-- MedCongress AI Companion – Fase 4 Schema
-- Consolidación: Reportes Académicos
-- Ejecutar en: Supabase SQL Editor

-- ============================================================
-- REPORTS
-- ============================================================
create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  congress_id       uuid not null references public.congresses(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  content           text not null, -- Markdown content
  report_type       text default 'summary' check (report_type in ('summary', 'full', 'topics')),
  status            text default 'ready',
  created_at        timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "reports: user select own"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "reports: user insert own"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "reports: user delete own"
  on public.reports for delete
  using (auth.uid() = user_id);

create index if not exists idx_reports_congress_id on public.reports(congress_id);
create index if not exists idx_reports_user_id on public.reports(user_id);
