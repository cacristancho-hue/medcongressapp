-- MedCongress - Fase 38: reportes de problemas / feedback de usuarios.
--
-- Durante la fase de construcción y primeros usos, los usuarios pueden reportar
-- un error o sugerencia desde la app. Se guarda aquí y (si hay webhook) nos
-- notifica. Aditiva, no destructiva. Idempotente.

create table if not exists public.feedback_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  email       text,
  message     text not null,
  page        text,
  user_agent  text,
  status      text not null default 'new' check (status in ('new', 'seen', 'resolved')),
  created_at  timestamptz not null default now()
);

alter table public.feedback_reports enable row level security;

-- Cualquiera (usuario logueado o anónimo) puede ENVIAR un reporte.
drop policy if exists "anyone can insert feedback" on public.feedback_reports;
create policy "anyone can insert feedback"
  on public.feedback_reports for insert
  with check (true);

-- La lectura queda restringida (sin policy de select) → solo service_role / admin.
create index if not exists feedback_reports_created_at_idx
  on public.feedback_reports (created_at desc);
