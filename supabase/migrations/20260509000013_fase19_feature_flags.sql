-- MedCongress - Fase 19: feature flags
-- Permite encender/apagar features sin redeploy y hacer rollouts graduales.
-- Tres niveles de granularidad (más específico gana):
--   1. Override por user (más prioridad)
--   2. Override por organization
--   3. Default global (con rollout_percentage 0-100)
-- Idempotente.

create table if not exists public.feature_flags (
  key                  text primary key,
  description          text,
  enabled              boolean not null default false,
  rollout_percentage   integer not null default 0
                       check (rollout_percentage between 0 and 100),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.feature_flag_overrides (
  id                  uuid primary key default gen_random_uuid(),
  flag_key            text not null references public.feature_flags(key) on delete cascade,
  user_id             uuid references auth.users(id) on delete cascade,
  organization_id     uuid references public.organizations(id) on delete cascade,
  enabled             boolean not null,
  created_at          timestamptz not null default now(),
  -- Exactamente uno de user_id u organization_id debe estar seteado.
  check (
    (user_id is not null and organization_id is null)
    or (user_id is null and organization_id is not null)
  )
);

create unique index if not exists idx_ff_override_user
  on public.feature_flag_overrides(flag_key, user_id)
  where user_id is not null;

create unique index if not exists idx_ff_override_org
  on public.feature_flag_overrides(flag_key, organization_id)
  where organization_id is not null;

alter table public.feature_flags enable row level security;
alter table public.feature_flag_overrides enable row level security;

do $$
begin
  -- Cualquier usuario autenticado puede leer feature_flags (necesita saber qué tiene activo).
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feature_flags'
      and policyname = 'feature_flags: authenticated read'
  ) then
    create policy "feature_flags: authenticated read"
      on public.feature_flags for select
      to authenticated
      using (true);
  end if;

  -- Overrides: solo se ven los del propio user o de orgs en las que es miembro.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feature_flag_overrides'
      and policyname = 'ff_overrides: user/org scope'
  ) then
    create policy "ff_overrides: user/org scope"
      on public.feature_flag_overrides for select
      using (
        user_id = auth.uid()
        or organization_id in (select public.user_org_ids())
      );
  end if;
end $$;

drop trigger if exists tg_feature_flags_updated_at on public.feature_flags;
create trigger tg_feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.tg_set_updated_at();

-- Función helper que resuelve "está activo este flag para este user?".
-- Usa el orden: override por user > override por cualquiera de sus orgs > default global.
create or replace function public.is_feature_enabled(p_flag_key text)
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  user_override boolean;
  org_override  boolean;
  flag          record;
  user_hash_pct integer;
begin
  -- 1) override por user
  select enabled into user_override
  from public.feature_flag_overrides
  where flag_key = p_flag_key and user_id = auth.uid();
  if found then return user_override; end if;

  -- 2) override por cualquiera de sus organizations
  select enabled into org_override
  from public.feature_flag_overrides
  where flag_key = p_flag_key
    and organization_id in (select public.user_org_ids())
  order by created_at desc
  limit 1;
  if found then return org_override; end if;

  -- 3) default global
  select enabled, rollout_percentage into flag
  from public.feature_flags
  where key = p_flag_key;
  if not found then return false; end if;
  if flag.enabled then return true; end if;
  if flag.rollout_percentage <= 0 then return false; end if;
  if flag.rollout_percentage >= 100 then return true; end if;

  -- Rollout estable por user: hash(user_id || flag_key) % 100 < rollout_percentage.
  user_hash_pct := abs(hashtext(coalesce(auth.uid()::text, '') || ':' || p_flag_key)) % 100;
  return user_hash_pct < flag.rollout_percentage;
end;
$$;

-- Seed inicial de algunos flags conocidos (idempotente vía ON CONFLICT).
insert into public.feature_flags (key, description, enabled, rollout_percentage)
values
  ('ai.async_processing',  'Procesamiento IA via cola en lugar de fire-and-forget', true,  100),
  ('ai.claude_for_topics', 'Usar Claude (en lugar de Gemini) para extracción de tópicos', true, 100),
  ('ui.live_jobs_status',  'Mostrar componente JobsStatus en página de congreso', true, 100),
  ('billing.stripe',       'Habilitar checkout con Stripe (cuando esté listo)',   false, 0),
  ('export.notebooklm',    'Exportar paquete NotebookLM',                          false, 0)
on conflict (key) do nothing;
