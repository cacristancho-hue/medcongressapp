# Disaster Recovery Plan — MDCONGRESS

Última actualización: 2026-05-09

## Niveles de protección

### Nivel 1 — Supabase PITR (Point-in-Time Recovery)
Heredamos del plan Supabase Pro:
- **Backups automáticos diarios** retenidos 7 días.
- **PITR** hasta 7 días atrás con granularidad de minutos.
- Restauración desde el dashboard de Supabase.
- **Costo**: incluido en plan Pro ($25 USD/mes).
- **RTO** (tiempo a restaurar): 5–30 min.
- **RPO** (datos perdidos máx): minutos.

### Nivel 2 — Backup propio en JSONL
Script `tools/backup_db.py` que dumpea cada tabla a JSONL.
- **Cuándo**: GitHub Actions workflow `.github/workflows/backup.yml` corre todos los días a las 06:17 UTC.
- **Dónde**: artifact del workflow run, retención 30 días.
- **Costo**: gratis (GitHub Actions público).
- **RTO**: 10–60 min (depende del volumen).
- **RPO**: hasta 24h.

### Nivel 3 — Storage (fotos)
Supabase Storage replica los archivos en S3 internamente. **No tenemos backup propio del storage hoy** — los archivos viven solo en `congress-photos` bucket.

**Mitigación recomendada para producción**:
- Habilitar **Storage replication a un bucket externo** (manual en Supabase dashboard) o
- Cron que copie archivos a un bucket S3 propio (futuro)
- Por ahora: Supabase mantiene su propia copia interna y replica entre availability zones.

## Procedimiento de restauración

### Si pierdes datos de una tabla específica (caso común)
1. Identifica el momento previo al incidente.
2. Supabase Dashboard → Database → Backups → Restore.
3. Selecciona timestamp.
4. Acepta. Toma 5–15 min.

### Si pierdes el proyecto Supabase entero (caso catastrófico)
1. Crea un nuevo proyecto Supabase.
2. Aplica todas las migraciones: `supabase db push --include-all` (con la nueva DB URL).
3. Descarga el último artifact de backup desde GitHub Actions.
4. Ejecuta restauración:
   ```bash
   python app/tools/restore_db.py \
     --in backups/<latest>/ \
     --url https://<new-ref>.supabase.co \
     --key $NEW_SERVICE_ROLE_KEY \
     --apply
   ```
5. Verifica con `tools/audit_rls.py` que las RLS estén intactas.
6. Actualiza Vercel env vars con el nuevo `NEXT_PUBLIC_SUPABASE_URL` y keys.
7. Storage: contactar Supabase para recuperar el bucket; si imposible, los archivos se perdieron.

### Si pierdes el repo / Vercel
1. Repo está en GitHub (`cacristancho-hue/MDCONGRESSapp`). Clonar.
2. Vercel: nuevo proyecto apuntando al mismo repo.
3. Configurar env vars (lista completa abajo).
4. Deploy.

## Variables de entorno críticas (deben re-configurarse en DR)

| Variable | Origen |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard (publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard (secret) |
| `OPENAI_API_KEY` | platform.openai.com |
| `GEMINI_API_KEY` | aistudio.google.com |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `MDCONGRESS_AI_ENABLED` | configuración propia (`true` en prod) |
| `CRON_SECRET` | generar con `openssl rand -hex 32` |
| `NEXT_PUBLIC_SENTRY_DSN` | sentry.io |
| `SENTRY_AUTH_TOKEN` | sentry.io (para sourcemaps en build) |

## Pruebas de DR (recomendado trimestralmente)

1. Desplegar la app en un Supabase de prueba.
2. Aplicar migraciones desde cero.
3. Restaurar desde un backup reciente (`--apply`).
4. Correr `audit_rls.py` y verificar que todo está protegido.
5. Hacer login y probar flujos críticos (upload + análisis).
6. Documentar tiempo total de recuperación.

## Contactos / responsables

- **Owner**: Carlos Cristancho — `cacristanchoo@gmail.com`
- **Soporte Supabase**: support@supabase.com (con plan Pro tienes prioridad)
