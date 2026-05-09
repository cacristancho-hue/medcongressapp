-- MedCongress AI Companion - Fase 10
-- Añadir estado 'retracted' a reference_candidates.verification_status.
-- Necesario para Retraction Watch / CrossRef update-to detection.
-- Ejecutar después de schema_fase9_deprecate_references.sql.
-- Idempotente.

do $$
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'reference_candidates'
      and c.conname = 'reference_candidates_verification_status_check'
  ) then
    alter table public.reference_candidates
      drop constraint reference_candidates_verification_status_check;
  end if;
end $$;

alter table public.reference_candidates
  add constraint reference_candidates_verification_status_check
  check (verification_status in ('verified','partially_verified','not_verified','ambiguous','retracted'));

-- Permitir registrar la fuente que confirmó la referencia.
alter table public.reference_candidates
  add column if not exists verification_source text,
  add column if not exists verification_notes text;

create index if not exists idx_reference_candidates_retracted
  on public.reference_candidates(verification_status)
  where verification_status = 'retracted';
