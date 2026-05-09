-- MedCongress AI Companion - Fase 11
-- Cost guard + rate limit para llamadas a OpenAI.
-- Tablas:
--   ai_usage          → log inmutable de cada llamada (auditoría + métricas)
--   ai_usage_limits   → cuota mensual por usuario (defaults plan FREE)
-- Ejecutar después de schema_fase10_retracted_status.sql.
-- Idempotente.

-- ============================================================
-- ai_usage_limits (cuotas)
-- ============================================================
create table if not exists public.ai_usage_limits (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  plan                    text not null default 'free' check (plan in ('free','congress','academic','admin')),
  monthly_image_quota     integer not null default 15,
  monthly_report_quota    integer not null default 1,
  monthly_cost_cap_usd    numeric(8,2) not null default 1.50,
  updated_at              timestamptz not null default now()
);

alter table public.ai_usage_limits enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ai_usage_limits'
      and policyname = 'ai_usage_limits: user select own'
  ) then
    create policy "ai_usage_limits: user select own"
      on public.ai_usage_limits for select
      using (auth.uid() = user_id);
  end if;
end $$;
-- INSERT/UPDATE: only via service role (server actions or admin scripts).

-- ============================================================
-- ai_usage (log inmutable)
-- ============================================================
create table if not exists public.ai_usage (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  action_type         text not null check (action_type in ('image_analysis','report_generation','reference_verification')),
  model               text,
  input_tokens        integer,
  output_tokens       integer,
  estimated_cost_usd  numeric(10,5),
  congress_id         uuid references public.congresses(id) on delete set null,
  image_id            uuid references public.congress_images(id) on delete set null,
  status              text not null default 'success' check (status in ('success','blocked','error')),
  error_message       text,
  created_at          timestamptz not null default now()
);

alter table public.ai_usage enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ai_usage'
      and policyname = 'ai_usage: user select own'
  ) then
    create policy "ai_usage: user select own"
      on public.ai_usage for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ai_usage'
      and policyname = 'ai_usage: user insert own'
  ) then
    create policy "ai_usage: user insert own"
      on public.ai_usage for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_ai_usage_user_month
  on public.ai_usage(user_id, created_at desc);

create index if not exists idx_ai_usage_action_month
  on public.ai_usage(action_type, created_at desc);

-- ============================================================
-- Trigger: auto-create FREE limits row on first auth.users insert
-- (extends the existing handle_new_user trigger from schema.sql)
-- ============================================================
create or replace function public.handle_new_user_limits()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.ai_usage_limits (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_limits on auth.users;
create trigger on_auth_user_created_limits
  after insert on auth.users
  for each row execute function public.handle_new_user_limits();

-- Backfill for existing users (idempotent).
insert into public.ai_usage_limits (user_id)
select id from auth.users
on conflict (user_id) do nothing;
