-- MedCongress - Fase 28: soft delete para referencias
-- Permite que las referencias se oculten si la imagen es borrada o si el usuario las borra manualmente.

alter table public.reference_candidates
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

create index if not exists idx_reference_candidates_active
  on public.reference_candidates(user_id, created_at desc)
  where deleted_at is null;
