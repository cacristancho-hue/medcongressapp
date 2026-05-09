-- MedCongress AI Companion - Fase 9
-- Deprecación oficial de public.references (legacy fase 3).
-- La fuente canónica es public.reference_candidates desde fase 7.
-- Esta migración:
--   1. Marca la tabla con un COMMENT visible en supabase studio.
--   2. NO borra la tabla — datos legacy de usuarios beta podrían existir.
--      Se mantendrá hasta confirmar que no hay filas o que se migraron.
-- Ejecutar después de schema_fase8_fixes.sql.
-- Idempotente.

comment on table public.references is
  'DEPRECATED desde fase 7. Usar public.reference_candidates. '
  'Esta tabla ya no recibe escrituras desde la app. '
  'Mantenida temporalmente para preservar datos legacy.';

-- Diagnóstico opcional para revisar si quedan filas:
-- select count(*) as legacy_rows from public.references;
