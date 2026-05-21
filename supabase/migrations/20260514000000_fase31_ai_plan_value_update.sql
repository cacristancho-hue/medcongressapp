-- Fase 31: ajustar valor percibido por plan
-- Free: 15 fotos, 2 reportes, USD 1.50
-- Paid: 100 fotos, 5 reportes, USD 10.00

alter table public.ai_usage_limits
  alter column monthly_report_quota set default 2;

update public.ai_usage_limits
set
  monthly_image_quota = case when plan = 'free' then 15 else 100 end,
  monthly_report_quota = case when plan = 'free' then 2 else 5 end,
  monthly_cost_cap_usd = case when plan = 'free' then 1.50 else 10.00 end,
  updated_at = now();

