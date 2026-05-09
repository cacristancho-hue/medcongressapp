-- MedCongress AI Companion - Fase 5 Schema
-- Verificacion bibliografica y trazabilidad
-- Ejecutar en: Supabase SQL Editor

alter table if exists public.references
  add column if not exists verification_source text default 'openalex',
  add column if not exists verification_notes text,
  add column if not exists confidence_score float;

create index if not exists idx_references_verification_status
  on public.references(verification_status);
