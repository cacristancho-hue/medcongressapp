-- MedCongress - Fase 21: analytics_events
-- Tabla append-only de eventos de producto (vs audit_log que rastrea acciones
-- sensibles para compliance). Pensada para entender uso real:
--   - "page_viewed" en cada navegación importante
--   - "feature_used" cuando alguien dispara una capacidad clave
--   - "funnel_step" para medir onboarding
-- No PII detallada en props; solo IDs anónimos y enums.
-- Idempotente.

create table if not exists public.analytics_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  event_name      text not null,
  props           jsonb default '{}'::jsonb,
  session_id      text,
  url_path        text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'analytics_events'
      and policyname = 'analytics: user insert own'
  ) then
    create policy "analytics: user insert own"
      on public.analytics_events for insert
      with check (auth.uid() = user_id or user_id is null);
  end if;

  -- Sólo admins via service-role pueden hacer SELECT — no exponemos analytics
  -- al cliente; lo agregamos en /admin/analytics.
end $$;

create index if not exists idx_analytics_event_created
  on public.analytics_events(event_name, created_at desc);

create index if not exists idx_analytics_user_created
  on public.analytics_events(user_id, created_at desc)
  where user_id is not null;

create index if not exists idx_analytics_org_created
  on public.analytics_events(organization_id, created_at desc)
  where organization_id is not null;
