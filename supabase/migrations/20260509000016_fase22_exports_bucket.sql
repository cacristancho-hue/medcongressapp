-- MedCongress - Fase 22: bucket privado para exports ZIP
-- Bucket separado de congress-photos: artefactos derivados que se autodestruyen.
-- Idempotente.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'congress-exports',
  'congress-exports',
  false,
  500 * 1024 * 1024,  -- 500 MB cap
  array['application/zip', 'application/octet-stream']
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'exports: insert own'
  ) then
    create policy "exports: insert own"
      on storage.objects for insert
      with check (
        bucket_id = 'congress-exports'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'exports: select own'
  ) then
    create policy "exports: select own"
      on storage.objects for select
      using (
        bucket_id = 'congress-exports'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'exports: delete own'
  ) then
    create policy "exports: delete own"
      on storage.objects for delete
      using (
        bucket_id = 'congress-exports'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;
