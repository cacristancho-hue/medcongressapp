-- MedCongress - Fase 15: ai_jobs queue
-- Cola persistente para procesamiento async de IA.
-- Permite que un usuario suba 100 fotos, cierre la pestaña y vuelva a verlas
-- procesadas. Sin esto el browser tiene que mantener la sesión abierta.
--
-- Diseño minimalista (MVP):
-- - Una sola tabla, status enum, retry con backoff manual
-- - Un worker (Supabase Edge Function o cron-job desde Vercel) procesa la cola
-- - Realtime opcional: client suscribe a UPDATE en su user_id para live status
--
-- Para v2 evaluar: Trigger.dev / Inngest / Supabase pg_cron.
-- Idempotente.

create table if not exists public.ai_jobs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  job_type        text not null
                  check (job_type in (
                    'image_analysis',
                    'topics_extraction',
                    'report_generation',
                    'reference_verification'
                  )),
  status          text not null default 'pending'
                  check (status in ('pending','processing','succeeded','failed','cancelled')),
  payload         jsonb not null default '{}'::jsonb,
  result          jsonb,
  error_message   text,
  attempt_count   integer not null default 0,
  max_attempts    integer not null default 3,
  scheduled_at    timestamptz not null default now(),
  started_at      timestamptz,
  finished_at     timestamptz,
  congress_id     uuid references public.congresses(id) on delete cascade,
  image_id        uuid references public.congress_images(id) on delete cascade,
  priority        integer not null default 100,  -- lower = higher priority
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.ai_jobs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ai_jobs'
      and policyname = 'ai_jobs: user select own'
  ) then
    create policy "ai_jobs: user select own"
      on public.ai_jobs for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ai_jobs'
      and policyname = 'ai_jobs: user insert own'
  ) then
    create policy "ai_jobs: user insert own"
      on public.ai_jobs for insert
      with check (auth.uid() = user_id);
  end if;

  -- Update queda restringido a service role (worker ejecuta con service key).
end $$;

create index if not exists idx_ai_jobs_user_status
  on public.ai_jobs(user_id, status, created_at desc);

create index if not exists idx_ai_jobs_status_priority_scheduled
  on public.ai_jobs(status, priority, scheduled_at)
  where status in ('pending', 'processing');

create index if not exists idx_ai_jobs_congress
  on public.ai_jobs(congress_id, status)
  where congress_id is not null;

drop trigger if exists tg_ai_jobs_updated_at on public.ai_jobs;
create trigger tg_ai_jobs_updated_at
  before update on public.ai_jobs
  for each row execute function public.tg_set_updated_at();

-- ============================================================
-- Atomic dequeue helper. Reserva el job más prioritario en estado pending.
-- Usado por el worker para procesar uno-a-uno sin race conditions.
-- ============================================================
create or replace function public.ai_jobs_claim_next(p_worker_id text)
returns public.ai_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.ai_jobs;
begin
  with next_job as (
    select id
    from public.ai_jobs
    where status = 'pending'
      and scheduled_at <= now()
      and attempt_count < max_attempts
    order by priority asc, scheduled_at asc
    limit 1
    for update skip locked
  )
  update public.ai_jobs j
  set status = 'processing',
      started_at = now(),
      attempt_count = j.attempt_count + 1,
      updated_at = now()
  from next_job
  where j.id = next_job.id
  returning j.* into claimed;

  return claimed;  -- NULL if no job claimed
end;
$$;
