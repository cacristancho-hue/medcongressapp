-- MedCongress AI Companion - Fase 26
-- Hardening de Integridad de Datos (Basado en Auditoría)

-- 1. Prevenir creación de múltiples maestros por accidente (Race Condition)
-- Creamos índices únicos parciales: solo puede haber una referencia "Maestra" por DOI/PMID por usuario.
create unique index if not exists ui_reference_candidates_doi_master
  on public.reference_candidates(user_id, detected_doi)
  where master_id is null and detected_doi is not null;

create unique index if not exists ui_reference_candidates_pmid_master
  on public.reference_candidates(user_id, detected_pmid)
  where master_id is null and detected_pmid is not null;

-- 2. Mejora de la función de deduplicación para ser más robusta
create or replace function public.find_or_create_master_reference()
returns trigger as $$
declare
  v_master_id uuid;
begin
  -- Si el registro que entra YA tiene un master_id manual, no hacemos nada
  if new.master_id is not null then
    return new;
  end if;

  -- Solo buscar si tenemos un identificador fuerte
  if new.detected_doi is not null or new.detected_pmid is not null then
    -- Buscar la referencia maestra existente
    -- Usamos un ordenamiento por fecha para que la más antigua sea la maestra
    select id into v_master_id
      from public.reference_candidates
     where user_id = new.user_id
       and master_id is null
       and id != new.id
       and (
         (new.detected_doi is not null and detected_doi = new.detected_doi)
         or
         (new.detected_pmid is not null and detected_pmid = new.detected_pmid)
       )
     order by created_at asc
     limit 1;

    -- Si encontramos una, vinculamos el nuevo registro a ella
    if v_master_id is not null then
      new.master_id := v_master_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;
