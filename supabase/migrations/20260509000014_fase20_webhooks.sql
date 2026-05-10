-- MedCongress - Fase 20: webhooks (outgoing)
-- Permite que sociedades médicas, hospitales y partners se enteren cuando
-- pasan eventos: report.generated, references.verified, congress.created, etc.
-- Patrón estándar (Stripe-style): endpoint + secret HMAC, retry con backoff,
-- payload JSON firmado con HMAC-SHA256 en header X-MedCongress-Signature.
-- Idempotente.

-- ============================================================
-- webhook_endpoints
-- ============================================================
create table if not exists public.webhook_endpoints (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  url             text not null,
  description     text,
  events          text[] not null default '{}',
  secret          text not null,
  enabled         boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (events <> '{}')
);

alter table public.webhook_endpoints enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'webhook_endpoints'
      and policyname = 'webhook_endpoints: own scope'
  ) then
    create policy "webhook_endpoints: own scope"
      on public.webhook_endpoints for select
      using (
        user_id = auth.uid()
        or organization_id in (select public.user_org_ids())
      );
  end if;
end $$;

create index if not exists idx_webhook_endpoints_org
  on public.webhook_endpoints(organization_id)
  where organization_id is not null;

create index if not exists idx_webhook_endpoints_enabled
  on public.webhook_endpoints(enabled)
  where enabled = true;

drop trigger if exists tg_webhook_endpoints_updated_at on public.webhook_endpoints;
create trigger tg_webhook_endpoints_updated_at
  before update on public.webhook_endpoints
  for each row execute function public.tg_set_updated_at();

-- ============================================================
-- webhook_deliveries (log inmutable de cada entrega)
-- ============================================================
create table if not exists public.webhook_deliveries (
  id               uuid primary key default gen_random_uuid(),
  endpoint_id      uuid not null references public.webhook_endpoints(id) on delete cascade,
  event            text not null,
  payload          jsonb not null,
  attempt_count    integer not null default 0,
  max_attempts     integer not null default 5,
  status           text not null default 'pending'
                   check (status in ('pending','delivered','failed','cancelled')),
  response_status  integer,
  response_body    text,
  scheduled_at     timestamptz not null default now(),
  delivered_at     timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.webhook_deliveries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'webhook_deliveries'
      and policyname = 'webhook_deliveries: own scope via endpoint'
  ) then
    create policy "webhook_deliveries: own scope via endpoint"
      on public.webhook_deliveries for select
      using (
        exists (
          select 1 from public.webhook_endpoints e
          where e.id = webhook_deliveries.endpoint_id
            and (e.user_id = auth.uid()
                 or e.organization_id in (select public.user_org_ids()))
        )
      );
  end if;
end $$;

create index if not exists idx_webhook_deliveries_status_scheduled
  on public.webhook_deliveries(status, scheduled_at)
  where status = 'pending';

create index if not exists idx_webhook_deliveries_endpoint_created
  on public.webhook_deliveries(endpoint_id, created_at desc);

-- ============================================================
-- Atomic claim para el worker
-- ============================================================
create or replace function public.webhook_claim_next()
returns public.webhook_deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.webhook_deliveries;
begin
  with next_d as (
    select id from public.webhook_deliveries
    where status = 'pending'
      and scheduled_at <= now()
      and attempt_count < max_attempts
    order by scheduled_at asc
    limit 1
    for update skip locked
  )
  update public.webhook_deliveries d
  set attempt_count = d.attempt_count + 1
  from next_d
  where d.id = next_d.id
  returning d.* into claimed;

  return claimed;
end;
$$;
