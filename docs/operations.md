# Operations Runbook — MedCongress

Última actualización: 2026-05-09

## Worker / cron — opciones para activar `/api/jobs/worker`

El endpoint `/api/jobs/worker` es el corazón del procesamiento async (análisis IA, reportes, verificación bibliográfica, webhook delivery). Necesita ser invocado periódicamente para drenar la cola.

Tres opciones, ordenadas por costo y simplicidad:

### Opción A — Vercel Cron (recomendado en producción) — $20 USD/mes
- Plan Vercel Pro permite definir crons en `vercel.json` (ya está configurado).
- Schedule: cada minuto.
- Incluido: logs, retry automático, dashboard.
- **Costo**: $20 USD/mes plan Pro (es lo que necesitas igual para sourcemaps Sentry y otros features).

```json
// vercel.json (ya existente)
{
  "crons": [{ "path": "/api/jobs/worker", "schedule": "* * * * *" }]
}
```

Headers que Vercel manda automáticamente al endpoint: `Authorization: Bearer ${CRON_SECRET}`.

### Opción B — cron-job.org (gratis, externo) — $0
- Servicio externo que pinguea URLs en horario.
- Setup: registrarse → crear cron job con URL = `https://medcongress.app/api/jobs/worker`, header `Authorization: Bearer <CRON_SECRET>`, frecuencia 1 min.
- Limitación gratis: 1 minuto frecuencia, hasta 50 jobs.
- **Riesgo**: dependes de un tercero. Si cron-job.org cae, tu cola se acumula.

### Opción C — pg_cron + http extension (Supabase) — $0 si tu plan lo permite
- Supabase Pro permite habilitar `pg_cron` y `http` desde Database → Extensions.
- Función SQL que invoca `https://medcongress.app/api/jobs/worker` con auth Bearer.
- Schedule via `cron.schedule('worker', '* * * * *', $$ select net.http_post(...) $$)`.
- **Limitación**: no todos los planes Supabase exponen `pg_cron` con superuser; verifica antes.
- **Riesgo**: más complejo de monitorear. Solo recomendado si ya tienes pg_cron disponible.

### Opción D — GitHub Actions (gratis pero solo cada 5 min) — $0
- Workflow `.github/workflows/cron-worker.yml` que invoca el endpoint en schedule.
- Limitación: GitHub Actions schedule mínimo es 5 minutos en planes gratuitos, y a veces se atrasa hasta 15 min.
- **No recomendado** para production: el SLA es pobre.

## Backups

Documentado en `docs/disaster-recovery.md`. TL;DR:
- **Nivel 1**: Supabase Pro PITR — diario, 7 días retención, restauración via dashboard.
- **Nivel 2**: GitHub Actions `.github/workflows/backup.yml` — diario JSONL artifact.
- **Nivel 3**: Storage solo replicado por Supabase internamente (no backup propio del bucket).

## Métricas y observabilidad

| Capa | Donde verla |
|---|---|
| Errores producción | Sentry dashboard (release tag = git SHA) |
| Métricas operacionales | `/dashboard/admin/metrics` |
| Audit log (eventos sensibles) | `/dashboard/admin/audit` |
| Analytics producto | `/dashboard/admin/analytics` |
| Health check público | `GET /api/health` |
| Vercel logs | dashboard.vercel.com → Functions → Logs |
| Supabase logs | dashboard.supabase.com → Database → Logs |

## Promoción de plan FREE → admin

Si necesitas dar acceso a `/dashboard/admin/*` a un user, ejecuta en Supabase SQL Editor:

```sql
update public.organizations
set plan = 'admin'
where id in (
  select organization_id
  from public.organization_memberships
  where user_id = '<user-uuid>' and role = 'owner'
);
```

## Rotación de secretos

Recomendado cada **90 días** o tras compartir credenciales:

| Secreto | Donde rotar |
|---|---|
| `OPENAI_API_KEY` | platform.openai.com → Settings → API Keys |
| `GEMINI_API_KEY` | aistudio.google.com → API Keys |
| `ANTHROPIC_API_KEY` | console.anthropic.com → Settings → API Keys |
| `SUPABASE_SERVICE_ROLE_KEY` | dashboard.supabase.com → Settings → API → Reset |
| Database password | dashboard.supabase.com → Settings → Database → Reset |
| `CRON_SECRET` | regenerar con `openssl rand -hex 32` |

Después de rotar: actualizar `.env.local` (si aplica), Vercel Production env vars, y GitHub Actions Secrets.

## Verificación rutinaria (mensual)

```bash
# 1. RLS posture
.venv/Scripts/python.exe app/tools/audit_rls.py \
  --url "$NEXT_PUBLIC_SUPABASE_URL" \
  --key "$NEXT_PUBLIC_SUPABASE_ANON_KEY"

# 2. SQL migrations lint
.venv/Scripts/python.exe app/tools/lint_sql.py

# 3. CI status (debe estar verde en main)
gh run list --limit 5

# 4. Backup más reciente disponible
gh run list --workflow="Backup nightly" --limit 3
```
