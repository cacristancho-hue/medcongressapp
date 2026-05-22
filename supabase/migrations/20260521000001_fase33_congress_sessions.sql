-- MedCongress - Fase 33: sesiones de congreso (ponencias/charlas).
--
-- Una sesión agrupa diapositivas (imágenes) por "qué charla", un eje distinto
-- de los tópicos (que agrupan por tema). Asignación manual; se añade además
-- `captured_at` para guardar la hora real de captura (EXIF) y habilitar a futuro
-- la autoagrupación por tiempo.
--
-- Aditiva y no destructiva: `session_id` es nullable (las imágenes existentes
-- quedan "Sin asignar"). Idempotente.

create table if not exists public.congress_sessions (
  id            uuid primary key default gen_random_uuid(),
  congress_id   uuid not null references public.congresses(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  speaker       text,
  room          text,
  session_date  date,
  starts_at     timestamptz,
  session_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

alter table public.congress_sessions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'congress_sessions' and policyname = 'congress_sessions: select own') then
    create policy "congress_sessions: select own"
      on public.congress_sessions for select
      using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'congress_sessions' and policyname = 'congress_sessions: insert own') then
    create policy "congress_sessions: insert own"
      on public.congress_sessions for insert
      with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'congress_sessions' and policyname = 'congress_sessions: update own') then
    create policy "congress_sessions: update own"
      on public.congress_sessions for update
      using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'congress_sessions' and policyname = 'congress_sessions: delete own') then
    create policy "congress_sessions: delete own"
      on public.congress_sessions for delete
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_congress_sessions_congress_id on public.congress_sessions(congress_id);
create index if not exists idx_congress_sessions_user_id on public.congress_sessions(user_id);

-- Vínculo imagen → sesión (nullable) + hora de captura (EXIF).
alter table public.congress_images
  add column if not exists session_id uuid references public.congress_sessions(id) on delete set null,
  add column if not exists captured_at timestamptz;

comment on column public.congress_images.session_id is
  'Sesión a la que pertenece la diapositiva. Null = sin asignar.';
comment on column public.congress_images.captured_at is
  'Hora real de captura de la foto (EXIF DateTimeOriginal), si está disponible.';

create index if not exists idx_congress_images_session_id
  on public.congress_images(session_id)
  where session_id is not null;
