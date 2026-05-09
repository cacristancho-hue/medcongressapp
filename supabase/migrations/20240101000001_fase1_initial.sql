-- MedCongress AI Companion – Fase 1 Schema
-- Ejecutar en: Supabase SQL Editor

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  full_name   text,
  role        text check (role in ('resident','fellow','specialist','professor')),
  specialty   text,
  country     text default 'Colombia',
  created_at  timestamptz not null default now(),
  unique(user_id)
);

alter table public.profiles enable row level security;

create policy "profiles: user ve solo el suyo"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles: user crea el suyo"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles: user actualiza el suyo"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Trigger: crear perfil vacío al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, role, specialty)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'specialty'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CONGRESSES
-- ============================================================
create table if not exists public.congresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  location    text,
  start_date  date,
  end_date    date,
  specialty   text,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.congresses enable row level security;

create policy "congresses: user ve solo los suyos"
  on public.congresses for select
  using (auth.uid() = user_id);

create policy "congresses: user crea los suyos"
  on public.congresses for insert
  with check (auth.uid() = user_id);

create policy "congresses: user actualiza los suyos"
  on public.congresses for update
  using (auth.uid() = user_id);

create policy "congresses: user borra los suyos"
  on public.congresses for delete
  using (auth.uid() = user_id);

-- Índice para listar congresos por usuario rápidamente
create index if not exists idx_congresses_user_id on public.congresses(user_id);
