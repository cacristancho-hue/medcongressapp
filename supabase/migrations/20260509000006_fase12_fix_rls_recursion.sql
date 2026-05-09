-- MedCongress - Fase 12 fix: rompe la recursión RLS en organization_memberships.
-- Problema: la policy original hacía un SELECT sobre la misma tabla protegida,
-- lo que postgres detecta como infinite recursion → HTTP 500.
-- Solución: helper SECURITY DEFINER que devuelve las orgs del usuario actual,
-- evitando que postgres re-aplique RLS al evaluar la policy.
-- Idempotente.

create or replace function public.user_org_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select organization_id
  from public.organization_memberships
  where user_id = auth.uid()
$$;

-- Reescribimos la policy de memberships sin self-reference.
drop policy if exists "memberships: see own + own-org" on public.organization_memberships;

create policy "memberships: see own"
  on public.organization_memberships for select
  using (user_id = auth.uid());

create policy "memberships: see same-org members"
  on public.organization_memberships for select
  using (organization_id in (select public.user_org_ids()));

-- Lo mismo aplica a organizations: la policy original era OK pero usemos el helper
-- por consistencia y rendimiento (helper cacheable por session).
drop policy if exists "organizations: member can read" on public.organizations;

create policy "organizations: member can read"
  on public.organizations for select
  using (id in (select public.user_org_ids()));

drop policy if exists "organizations: owner/admin can update" on public.organizations;

create policy "organizations: owner/admin can update"
  on public.organizations for update
  using (
    id in (
      select organization_id
      from public.organization_memberships
      where user_id = auth.uid() and role in ('owner','admin')
    )
  );
