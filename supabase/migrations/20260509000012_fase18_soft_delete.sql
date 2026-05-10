-- MedCongress - Fase 18: soft delete
-- Marcar registros borrados con deleted_at en lugar de eliminarlos físicamente.
-- Beneficios:
--   - undo / restore en UI
--   - retención para compliance / soporte
--   - audit trail de qué se borró cuándo
-- Aplica a: congresses, congress_images, reports, organizations.
-- (audit_log, ai_usage, rate_limit_buckets son inmutables o efímeros — no aplican.)
-- Idempotente.

alter table public.congresses
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

alter table public.congress_images
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

alter table public.reports
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

alter table public.organizations
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

-- Partial indexes: el caso común es WHERE deleted_at IS NULL.
-- Los hacemos partial para no inflar el índice con filas archivadas.
create index if not exists idx_congresses_active
  on public.congresses(user_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_congress_images_active
  on public.congress_images(congress_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_reports_active
  on public.reports(congress_id, created_at desc)
  where deleted_at is null;

-- Vistas convenientes: solo activos (lo que el usuario ve por default).
create or replace view public.congresses_active as
  select * from public.congresses where deleted_at is null;

create or replace view public.congress_images_active as
  select * from public.congress_images where deleted_at is null;

create or replace view public.reports_active as
  select * from public.reports where deleted_at is null;

-- Vistas para recovery / archive UI.
create or replace view public.congresses_archived as
  select * from public.congresses where deleted_at is not null;

create or replace view public.congress_images_archived as
  select * from public.congress_images where deleted_at is not null;

create or replace view public.reports_archived as
  select * from public.reports where deleted_at is not null;
