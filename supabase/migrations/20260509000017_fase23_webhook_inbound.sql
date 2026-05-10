-- MedCongress - Fase 23: incoming webhooks
-- Endpoints externos (Stripe, sociedades, integraciones futuras) postean
-- aquí. Guardamos el payload bruto + metadata para procesar async.
-- Idempotente.

create table if not exists public.webhook_inbound (
  id              uuid primary key default gen_random_uuid(),
  provider        text not null,        -- 'stripe', 'society-x', etc.
  event_type      text,
  payload         jsonb not null,
  signature       text,
  signature_valid boolean not null default false,
  processed       boolean not null default false,
  process_error   text,
  received_at     timestamptz not null default now(),
  processed_at    timestamptz,
  source_ip       text
);

alter table public.webhook_inbound enable row level security;

-- Solo service-role escribe; nadie via REST anon-key.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'webhook_inbound'
      and policyname = 'webhook_inbound: deny all to anon'
  ) then
    create policy "webhook_inbound: deny all to anon"
      on public.webhook_inbound for select
      using (false);
  end if;
end $$;

create index if not exists idx_webhook_inbound_provider_received
  on public.webhook_inbound(provider, received_at desc);

create index if not exists idx_webhook_inbound_unprocessed
  on public.webhook_inbound(received_at)
  where processed = false;
