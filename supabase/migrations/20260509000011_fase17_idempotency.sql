-- MedCongress - Fase 17: idempotency keys
-- Cuando el cliente reintenta una server action (network flake, double-click,
-- React 19 transitions), no queremos cobrar IA dos veces ni duplicar inserts.
-- El cliente envía un idempotency_key único; el wrapper:
--   - si la key existe y status=succeeded → devuelve el resultado guardado
--   - si la key existe y status=processing → bloquea con 409
--   - si no existe → la inserta como processing, ejecuta, persiste resultado
-- Idempotente.

create table if not exists public.idempotency_keys (
  key            text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  action         text not null,
  status         text not null default 'processing'
                 check (status in ('processing','succeeded','failed')),
  result         jsonb,
  error_message  text,
  created_at     timestamptz not null default now(),
  finished_at    timestamptz
);

alter table public.idempotency_keys enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'idempotency_keys'
      and policyname = 'idempotency: user select own'
  ) then
    create policy "idempotency: user select own"
      on public.idempotency_keys for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'idempotency_keys'
      and policyname = 'idempotency: user insert own'
  ) then
    create policy "idempotency: user insert own"
      on public.idempotency_keys for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'idempotency_keys'
      and policyname = 'idempotency: user update own'
  ) then
    create policy "idempotency: user update own"
      on public.idempotency_keys for update
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_idempotency_user_action
  on public.idempotency_keys(user_id, action, created_at desc);

-- Limpieza opcional: keys más viejas que 7 días son seguras de purgar.
create or replace function public.idempotency_purge_old()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.idempotency_keys
  where created_at < now() - interval '7 days'
$$;
