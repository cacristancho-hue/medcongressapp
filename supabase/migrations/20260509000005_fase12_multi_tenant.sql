-- MedCongress AI Companion - Fase 12
-- Multi-tenant foundation: organizations + memberships + roles.
-- Designed for B2B (sociedades médicas, hospitales, universidades) sin
-- romper el flujo individual existente: cada usuario tiene su workspace
-- personal por defecto.
-- Ejecutar después de schema_fase11_ai_usage.sql.
-- Idempotente.

-- ============================================================
-- organizations
-- ============================================================
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  type        text not null default 'individual'
              check (type in ('individual','society','hospital','university','enterprise','admin')),
  plan        text not null default 'free'
              check (plan in ('free','congress','academic','enterprise','admin')),
  country     text,
  specialty   text,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ============================================================
-- organization_memberships (N:M users <-> organizations)
-- ============================================================
create table if not exists public.organization_memberships (
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  role             text not null default 'member'
                   check (role in ('owner','admin','member','viewer')),
  created_at       timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organization_memberships enable row level security;

create index if not exists idx_org_memberships_user
  on public.organization_memberships(user_id);

-- ============================================================
-- RLS: organizations
--   Un usuario ve organizations en las que es miembro.
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organizations'
      and policyname = 'organizations: member can read'
  ) then
    create policy "organizations: member can read"
      on public.organizations for select
      using (
        exists (
          select 1 from public.organization_memberships m
          where m.organization_id = organizations.id
            and m.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organizations'
      and policyname = 'organizations: owner/admin can update'
  ) then
    create policy "organizations: owner/admin can update"
      on public.organizations for update
      using (
        exists (
          select 1 from public.organization_memberships m
          where m.organization_id = organizations.id
            and m.user_id = auth.uid()
            and m.role in ('owner','admin')
        )
      );
  end if;
end $$;

-- INSERT into organizations: only via service role / triggers / admin actions.

-- ============================================================
-- RLS: organization_memberships
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organization_memberships'
      and policyname = 'memberships: see own + own-org'
  ) then
    create policy "memberships: see own + own-org"
      on public.organization_memberships for select
      using (
        user_id = auth.uid()
        or exists (
          select 1 from public.organization_memberships m2
          where m2.organization_id = organization_memberships.organization_id
            and m2.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- ============================================================
-- Trigger: cada nuevo auth.users → crea su workspace personal
-- ============================================================
create or replace function public.handle_new_user_org()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  org_id uuid;
begin
  insert into public.organizations (name, type, plan)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Workspace personal'),
    'individual',
    'free'
  )
  returning id into org_id;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (org_id, new.id, 'owner')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_org on auth.users;
create trigger on_auth_user_created_org
  after insert on auth.users
  for each row execute function public.handle_new_user_org();

-- ============================================================
-- Backfill: para usuarios existentes que NO tienen organización
-- ============================================================
do $$
declare
  u record;
  new_org_id uuid;
begin
  for u in
    select au.id as user_id, au.email,
           coalesce(p.full_name, au.email, 'Workspace personal') as display_name
    from auth.users au
    left join public.profiles p on p.user_id = au.id
    where not exists (
      select 1 from public.organization_memberships m
      where m.user_id = au.id
    )
  loop
    insert into public.organizations (name, type, plan)
    values (u.display_name, 'individual', 'free')
    returning id into new_org_id;

    insert into public.organization_memberships (organization_id, user_id, role)
    values (new_org_id, u.user_id, 'owner');
  end loop;
end $$;

-- ============================================================
-- Add organization_id (nullable) to existing tables for future B2B sharing.
-- NULL = personal (legacy). Cuando esté poblado, RLS B2B aplica.
-- ============================================================
alter table public.congresses
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;

alter table public.reports
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;

create index if not exists idx_congresses_organization_id
  on public.congresses(organization_id);

create index if not exists idx_reports_organization_id
  on public.reports(organization_id);

-- ============================================================
-- Backfill: poblar organization_id en filas existentes con la org personal del owner
-- ============================================================
update public.congresses c
set organization_id = (
  select m.organization_id
  from public.organization_memberships m
  join public.organizations o on o.id = m.organization_id
  where m.user_id = c.user_id and o.type = 'individual'
  limit 1
)
where c.organization_id is null;

update public.reports r
set organization_id = (
  select m.organization_id
  from public.organization_memberships m
  join public.organizations o on o.id = m.organization_id
  where m.user_id = r.user_id and o.type = 'individual'
  limit 1
)
where r.organization_id is null;

-- ============================================================
-- Updated_at trigger helper (reusable for organizations)
-- ============================================================
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tg_organizations_updated_at on public.organizations;
create trigger tg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.tg_set_updated_at();
