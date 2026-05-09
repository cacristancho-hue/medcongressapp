-- MedCongress - Fase 13: audit_log
-- Registro inmutable de acciones críticas para compliance y debugging.
-- Cada server action sensible escribe aquí (login, upload, delete, AI call,
-- billing change, role change, quota override).
-- NO es PII detallada del usuario; es log de eventos.
-- Idempotente.

create table if not exists public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  action          text not null,
  resource_type   text,
  resource_id     uuid,
  status          text not null default 'success'
                  check (status in ('success','denied','error')),
  metadata        jsonb default '{}'::jsonb,
  ip_address      text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

alter table public.audit_log enable row level security;

-- RLS: el usuario solo ve sus propios logs.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'audit_log'
      and policyname = 'audit_log: user select own'
  ) then
    create policy "audit_log: user select own"
      on public.audit_log for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'audit_log'
      and policyname = 'audit_log: user insert own'
  ) then
    create policy "audit_log: user insert own"
      on public.audit_log for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Indexes para queries de admin/debug.
create index if not exists idx_audit_log_user_created
  on public.audit_log(user_id, created_at desc);

create index if not exists idx_audit_log_action_created
  on public.audit_log(action, created_at desc);

create index if not exists idx_audit_log_organization
  on public.audit_log(organization_id, created_at desc)
  where organization_id is not null;

create index if not exists idx_audit_log_status_created
  on public.audit_log(status, created_at desc)
  where status != 'success';
