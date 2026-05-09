-- MedCongress - Fase 14: rate_limit_buckets
-- Token-bucket rate limiting persisted in Postgres.
-- Avoids the cost/complexity of Upstash Redis at MVP scale.
-- Atomic with SELECT...FOR UPDATE; safe for concurrent server actions.
-- Idempotente.

create table if not exists public.rate_limit_buckets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  bucket_key      text not null,           -- e.g. 'image_analysis', 'login_attempt'
  window_started  timestamptz not null default now(),
  hit_count       integer not null default 0,
  unique (user_id, bucket_key, window_started)
);

alter table public.rate_limit_buckets enable row level security;

-- Solo service role / server actions escriben aquí. Usuario no necesita verlo.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rate_limit_buckets'
      and policyname = 'rate_limit: user select own'
  ) then
    create policy "rate_limit: user select own"
      on public.rate_limit_buckets for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rate_limit_buckets'
      and policyname = 'rate_limit: user upsert own'
  ) then
    create policy "rate_limit: user upsert own"
      on public.rate_limit_buckets for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rate_limit_buckets'
      and policyname = 'rate_limit: user update own'
  ) then
    create policy "rate_limit: user update own"
      on public.rate_limit_buckets for update
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_rate_limit_user_bucket_window
  on public.rate_limit_buckets(user_id, bucket_key, window_started desc);

-- Función atómica de chequeo + incremento.
-- Devuelve true si se permite, false si excede el límite.
create or replace function public.rate_limit_check(
  p_user_id      uuid,
  p_bucket_key   text,
  p_max_hits     integer,
  p_window_secs  integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  current_window timestamptz;
begin
  -- Truncate "now" to the start of the current window.
  current_window := date_trunc('second', now()) - (
    extract(epoch from now())::bigint % p_window_secs
  ) * interval '1 second';

  insert into public.rate_limit_buckets (user_id, bucket_key, window_started, hit_count)
  values (p_user_id, p_bucket_key, current_window, 1)
  on conflict (user_id, bucket_key, window_started)
  do update set hit_count = rate_limit_buckets.hit_count + 1
  returning hit_count into current_count;

  return current_count <= p_max_hits;
end;
$$;

-- Limpieza periódica (puede correr como cron; por ahora se purga manual).
create or replace function public.rate_limit_purge_old()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limit_buckets
  where window_started < now() - interval '7 days'
$$;
