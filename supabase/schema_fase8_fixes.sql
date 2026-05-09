-- MedCongress AI Companion - Fase 8 Fixes
-- Correcciones críticas detectadas en auditoría interna 2026-05-09:
--   1. BUG-1: reports.report_type CHECK no incluye 'academic_outline',
--      pero el código (ai.ts, polyglot-reports.ts) inserta ese valor → falla en runtime.
--   2. RIESGO-2: reports no tenía policy de UPDATE.
-- Ejecutar en: Supabase SQL Editor, después de schema_fase7_reference_candidates.sql.
-- Idempotente: seguro de re-ejecutar.

-- ============================================================
-- FIX 1: Ampliar CHECK de report_type
-- ============================================================
do $$
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'reports'
      and c.conname = 'reports_report_type_check'
  ) then
    alter table public.reports drop constraint reports_report_type_check;
  end if;
end $$;

alter table public.reports
  add constraint reports_report_type_check
  check (report_type in ('summary','full','topics','academic_outline'));

-- ============================================================
-- FIX 2: Policy UPDATE faltante en reports
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reports'
      and policyname = 'reports: user update own'
  ) then
    create policy "reports: user update own"
      on public.reports for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
