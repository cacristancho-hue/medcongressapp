-- MedCongress - Fase 37: facturación (suscripción Pro vía Lemon Squeezy).
--
-- Añade el plan 'pro' (individual de pago) al check de ai_usage_limits y las
-- columnas para rastrear la suscripción de Lemon Squeezy. El webhook de LS
-- actualiza estas columnas + el plan/cuotas al pagar/cancelar/expirar.
-- Aditiva, no destructiva. Idempotente.

-- 1. Permitir el plan 'pro' (el check original solo tenía free/congress/academic/admin).
alter table public.ai_usage_limits
  drop constraint if exists ai_usage_limits_plan_check;

alter table public.ai_usage_limits
  add constraint ai_usage_limits_plan_check
  check (plan in ('free', 'pro', 'congress', 'academic', 'admin'));

-- 2. Columnas de suscripción Lemon Squeezy.
alter table public.ai_usage_limits
  add column if not exists ls_customer_id        text,
  add column if not exists ls_subscription_id    text,
  add column if not exists ls_variant_id         text,
  add column if not exists subscription_status   text,
  add column if not exists subscription_renews_at timestamptz,
  add column if not exists subscription_ends_at   timestamptz;

comment on column public.ai_usage_limits.ls_subscription_id is
  'ID de la suscripción en Lemon Squeezy (merchant of record). Lo setea el webhook.';
comment on column public.ai_usage_limits.subscription_status is
  'Estado LS: active|on_trial|past_due|cancelled|expired|paused|unpaid. Pro activo mientras esté en active/on_trial/cancelled-dentro-de-periodo.';
