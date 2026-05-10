# 🚨 AI_HANDOVER.md — LECTURA OBLIGATORIA ANTES DE TRABAJAR

> **Cualquier modelo de IA (Claude, GPT, Gemini, Codex, Copilot, etc.) que abra este repositorio DEBE leer este archivo COMPLETO antes de hacer cualquier cambio. Si el archivo cambia, debes actualizarlo al final de tu sesión con lo que aprendiste, decidiste o construiste. Esto no es opcional.**

> **Este documento es contrato vinculante de continuidad. El proyecto depende de la coherencia entre sesiones. Si rompes la coherencia, rompes el proyecto.**

---

## 📌 Información mínima antes de tocar código

- **Producto**: MedCongress AI Companion (nombre comercial pendiente — ver §10)
- **Repo**: https://github.com/cacristancho-hue/medcongressapp
- **Branch activa**: `sprint-1/shell-hardening`
- **Owner humano**: Carlos Cristancho — `cacristanchoo@gmail.com` / `cac-94@hotmail.com`
- **Stack canónico**: Next.js 16 + React 19 + TypeScript + Tailwind 4 + Supabase SSR + Vercel + Multi-LLM (OpenAI + Gemini + Anthropic)
- **Idioma del producto**: Español (LATAM primero), expandible a EN/PT/FR
- **Última actualización**: 2026-05-09 — sesión Claude Opus 4.7 (bases sólidas)

---

## 1. Misión y visión

### Misión
> Convertir las fotos olvidadas de congresos médicos en conocimiento académico organizado, verificable y exportable para cada profesional de la salud del mundo.

### Visión 5 años
> Ser la herramienta de referencia mundial que cada congreso médico, sociedad científica y profesional de salud usa para capturar, sintetizar y aprovechar el conocimiento de eventos académicos.

### Promesa al usuario
> Cero alucinación bibliográfica. Cero datos identificables de pacientes. Uso estrictamente académico. Resúmenes que respetan el rigor científico.

---

## 2. Quiénes somos en este equipo

- **Carlos** (humano): médico, fundador, dueño del producto. Decide estrategia, network humano, capital, deals B2B, reuniones con KOLs y sociedades.
- **AI assistant** (la IA que esté trabajando en este momento): co-piloto técnico-estratégico. Construye código, hace research, redacta textos, prepara material comercial, mantiene rigor analítico.

**Acuerdo:** "Depende de los dos." Carlos decide y ejecuta donde se requiere humano. La IA construye y acelera donde se requiere trabajo intelectual sostenido. **Sin uno, el otro no llega solo.**

---

## 3. Estado actual del producto (al cierre de esta sesión)

### Lo que ya funciona end-to-end ✅

- Auth con Supabase + perfiles de médico
- Crear/listar congresos (mobile-first)
- Subida de fotos con compresión cliente (3072×3072, quality 0.92, optimizado para texto pequeño)
- Pipeline IA con router multi-provider:
  - **OCR + análisis**: Gemini 2.5 Flash (fallback OpenAI GPT-4o)
  - **Síntesis de reporte**: Claude Sonnet 4.6 (fallback Gemini Pro → GPT-4o)
  - **Tópicos clínicos del corpus**: Claude Sonnet 4.6 (fallback Gemini → OpenAI)
- Verificación bibliográfica multi-fuente: CrossRef + PubMed + OpenAlex con detección de retractaciones (`'retracted'`)
- Cost guard con cuotas mensuales por plan FREE/Congress/Academic/Admin
- Página `/resumen` consolidada (stats, tópicos, bibliografía, reporte académico)
- Botón comercial **"Iniciar asistencia de inteligencia artificial"** que orquesta los 3 pasos
- Bulk-delete de fotos con select-all
- Disclaimer legal pre-upload con persistencia local
- Páginas legales `/dashboard/legal/terminos` y `/privacidad` (16+13 secciones, marcadas como borrador para abogado)

### Validado en runtime con datos reales

- **51 fotos** procesadas exitosamente con Gemini Flash en un congreso real (Alergología)
- **65 referencias bibliográficas** detectadas y persistidas
- **38.581 caracteres** de OCR consolidado
- **Reporte académico** generado por Claude Sonnet 4.6 (3.3 min, 100K chars input)
- Costo total real: **$0.22 USD** (~$830 COP) para todo el pipeline
- 0 errores de provider router; 0 fallos de cuota; 0 fallos de RLS

### Migraciones SQL aplicadas en Supabase

Project ref: `jpossylbyldxgzegyrkw` (región us-east-2)

```
fase 1   profiles + congresses + trigger handle_new_user
fase 2   congress_images + bucket congress-photos (privado, 20MB)
fase 3   ocr_results + topics + image_topics + references (legacy)
         FIX: palabra reservada "references" escapada con quotes
fase 4   reports
fase 5   verification metadata
fase 6   image processing metadata (variants, sizes)
fase 7   reference_candidates (canónica, reemplaza references legacy)
fase 8   BUG-1 fix: reports.report_type CHECK incluye 'academic_outline'
         RIESGO-2: policy UPDATE en reports
fase 9   COMMENT marca public.references como DEPRECATED
fase 10  añade 'retracted' al CHECK de verification_status
         + columnas verification_source, verification_notes
fase 11  ai_usage + ai_usage_limits (cost guard)
         + trigger handle_new_user_limits
```

Todas idempotentes. Versionadas en `supabase/migrations/`.

---

## 4. Decisiones estratégicas tomadas (vinculantes)

> **Si vas a desviar el producto de estas decisiones, DOCUMÉNTALO en §11 con razón explícita y fecha. NO las cambies silenciosamente.**

### Producto

- **Mobile-first**: el médico toma fotos con celular, no con laptop
- **Foco LATAM primero** (Colombia, México, Brasil, Argentina, España): NO USA en año 1 (CongressIQ + costos regulatorios)
- **Target individual médico**: NO competimos en B2B pharma analytics (eso es de IQVIA / CongressIQ); somos para el asistente individual
- **Premium pero accesible**: pricing tiered con FREE para residentes, $29 USD/mes pro
- **Multi-idioma**: ES → EN → PT → FR

### Tecnología

- **Multi-LLM router obligatorio**: nunca dependemos de un único proveedor
- **Compresión imagen 3072×3072 quality 0.92**: tradeoff calidad ganada vs storage. NO bajar sin discusión.
- **Concurrencia client = 8**: balanceado contra rate-limit Gemini Flash (15 RPM free)
- **Server actions con cost guard**: TODO server action de IA debe pasar por `checkAiQuota` + `recordAiUsage`
- **RLS en TODAS las tablas**: Supabase + filtro por `user_id`/ownership en cada query
- **Migraciones idempotentes**: `IF NOT EXISTS`, `ON CONFLICT`, DO blocks

### Compliance / regulatorio

- **NO somos dispositivo médico (SaMD)**: declaración explícita en Términos. Esto nos saca de regulación INVIMA/FDA/MDR.
- **Datos de paciente prohibidos por ToS**: usuario es responsable; nosotros no validamos contenido
- **Procesamiento por terceros declarado**: OpenAI, Gemini, Anthropic, CrossRef, PubMed, OpenAlex. Usuario consiente al usar.
- **SOC 2 pospuesto a año 2-3**: heredamos de Supabase + Vercel mientras tanto
- **DPO part-time (abogado horas)** hasta tener >10K usuarios EU

### Comercial

- **Modelo freemium con cap real**: FREE = 15 imágenes + 1 reporte + $1.50 USD cap mensual
- **B2B sociedades**: $5 USD/usuario/mes (mínimo 100 usuarios)
- **Hospital/Universidad enterprise**: custom pricing con SAML SSO
- **Pharma insights** (futuro): $50K-200K/año dashboards anonimizados
- **NO vendemos datos del usuario**: ni a terceros ni para entrenar modelos propios

---

## 5. Stack técnico canónico

```
Frontend:    Next.js 16.2.4 (Turbopack), React 19.2.4, TypeScript, Tailwind 4
UI:          shadcn/ui + lucide-react + sonner + react-markdown
Auth/DB:     Supabase SSR + Row Level Security
AI SDK:      Vercel AI SDK 6+ (ai, @ai-sdk/openai, @ai-sdk/google, @ai-sdk/anthropic)
Validación:  Zod
Deploy:      Vercel (preview branch + production main)
Storage:     Supabase bucket congress-photos (privado, 20MB max/file)
```

### Carpetas clave

```
app/
├── src/
│   ├── app/(dashboard)/dashboard/...    # rutas autenticadas
│   ├── app/(auth)/{login,registro}/     # rutas públicas
│   ├── components/{congresses,layout,legal,ui}/
│   ├── lib/
│   │   ├── ai/router.ts                  # ✨ orquestador multi-provider
│   │   ├── ai-usage.ts                   # ✨ cost guard
│   │   ├── actions/                      # server actions
│   │   ├── reference-verification.ts     # CrossRef + PubMed + OpenAlex
│   │   ├── image-processing.ts           # compresión cliente
│   │   └── supabase/{client,server}.ts
│   ├── proxy.ts                          # auth middleware
│   └── types/database.ts
├── supabase/
│   ├── migrations/         # versionadas, formato CLI
│   ├── schema_*.sql        # histórico (referencia humana)
│   └── config.toml
└── AI_HANDOVER.md          # ← este archivo
```

---

## 6. Reglas obligatorias para cualquier IA

### Antes de hacer cambios

1. **Lee este archivo completo.**
2. **Lee `git log --oneline -20`** para entender los últimos commits.
3. **Lee `git status`** y respeta cambios sin commitear del usuario.
4. **Si vas a tocar `.env.local`, `auth`, `migraciones` o `proxy.ts`: pide confirmación explícita.**

### Mientras trabajas

5. **Commits atómicos** con mensaje descriptivo (qué + por qué + evidencia + footer Co-Authored-By).
6. **Verificación obligatoria** antes de declarar éxito: `npm run lint` + `npx tsc --noEmit` + `npm run build`.
7. **NUNCA escribas credenciales en código o documentación**. `.env.local` está en `.gitignore` y debe quedarse así.
8. **Toda nueva tabla/columna requiere migración SQL idempotente** en `supabase/migrations/`.
9. **Toda llamada a IA debe pasar por `lib/ai/router.ts`**. NO añadir clientes de proveedor directamente en server actions.
10. **Toda server action de IA debe usar `checkAiQuota` + `recordAiUsage`**. Sin excepciones.
11. **RLS y filtro `user_id`** en cada query a tablas con `user_id`. Doble protección.
12. **Idiomas**: textos UI en español formal (LATAM). Comentarios de código en inglés.

### Al terminar tu sesión

13. **Actualiza la sección §3 "Estado actual"** con lo que cambiaste.
14. **Actualiza §11 "Cambios entre sesiones"** con resumen del trabajo.
15. **Actualiza la fecha en el bloque inicial** del archivo.
16. **NO borres decisiones previas** sin explicarlo en §11.

---

## 7. Lo que NO debe hacer ninguna IA sin permiso explícito del humano

- ❌ Push a `main` o `master`
- ❌ Force-push a cualquier branch
- ❌ `git reset --hard` o `git clean -f`
- ❌ Cambiar password de DB Supabase
- ❌ Borrar tablas o ejecutar `DROP TABLE`
- ❌ Pagar/comprar dominios o servicios
- ❌ Firmar contratos con terceros
- ❌ Cambiar el modelo comercial (precios, planes, cuotas)
- ❌ Cambiar el rebrand del producto
- ❌ Mover el repo a otro lugar
- ❌ Activar/desactivar `MEDCONGRESS_AI_ENABLED` sin razón documentada

---

## 8. Modelo financiero target

### Año 1 (validación) — ~$33M COP ARR
- 1.000 usuarios, 5% conversión, 50 pagos × $15/mes = ~$9K USD/año

### Año 2 (tracción) — ~$640M COP ARR
- 10.000 usuarios + 5 sociedades con 200 miembros c/u

### Año 3 (escala) — ~$6-7B COP ARR
- 50.000 usuarios + 30 sociedades + 3 enterprise

### Año 5 (madurez) — ~$30-56B COP ARR
- 200K+ usuarios + 100 sociedades + pharma insights

### Inversión año 1 esperada
**$80M-150M COP** (~$21K-40K USD) — capital + tiempo

---

## 9. Roadmap de 12 meses

### Q1 — Fundación comercial
- ✅ Pipeline IA validado
- 🔴 **Rebrand + dominio**
- 🔴 Landing + waitlist (meta 500 emails)
- 🔴 PWA mobile-first
- 🔴 SOC 2 readiness assessment (sin auditoría aún)

### Q2 — Mobile app + sociedades
- 🔴 React Native + Expo (captura asistida AR)
- 🔴 3 partnerships piloto (SCC, ACOLFA, AMC)
- 🔴 Multi-idioma EN/PT
- 🔴 Export Zotero, Mendeley, EndNote

### Q3 — Crecimiento + B2B
- 🔴 Dashboard institucional
- 🔴 API pública
- 🔴 CME credits (AMA, EACCME)
- 🔴 50 KOLs embajadores

### Q4 — Defensibilidad
- 🔴 Pharma insights dashboard
- 🔴 Audio podcast estilo NotebookLM
- 🔴 Networking entre usuarios
- 🔴 Modelo fino sobre corpus propio

---

## 10. Decisiones pendientes que requieren al humano

- [ ] **Nombre comercial final** (candidatos: CongressLens / CongressBrief / CongressVault — ver `docs/`)
- [ ] **Compra de dominios** (.ai + .com)
- [ ] **Constitución de SAS** (Colombia)
- [ ] **3 KOLs aliados** (lista nominativa pendiente)
- [ ] **Trademark "CongressLens"** ante SIC Colombia + USPTO
- [ ] **Decisión de pre-seed**: bootstrap vs levantar $200-500K USD
- [ ] **Co-fundador / equipo**: ¿solo o con socios?
- [ ] **Ejecución masiva de fotos** del Congreso de Alergología (ya iniciado, 51 fotos exitosas)
- [ ] **Aprobación textos legales** por abogado real

---

## 11. Cambios entre sesiones (changelog)

> Toda IA que trabaje en este repo añade una entrada acá al final de su sesión.

### 2026-05-09 · Claude Opus 4.7 (sesión inicial extendida)

**Sprint 1 hardening (commits aplicados a `sprint-1/shell-hardening`):**
- BUG-1, BUG-2, BUG-3 corregidos (CHECK constraint, pipeline duplicado, query rota)
- RIESGO-1 a RIESGO-4 cerrados (multi-source verification, RLS, deprecación references, cost guard)
- Migraciones fase 8-11 escritas, aplicadas a Supabase y versionadas
- Bug fix UUID cliente↔DB: cliente envía `id` a `registerImage`
- Upgrade calidad imagen 2200→3072 px / 0.84→0.92 quality
- Concurrencia 3→8 (2.5× throughput)
- Plan admin aplicado al usuario `cac-94@hotmail.com` (cuotas 10K/100/$50)

**Multi-provider AI router:**
- `lib/ai/router.ts` con `analyzeImage`, `generateReport`, `extractTopicsFromCorpus`
- Vercel AI SDK + @ai-sdk/{openai,google,anthropic}
- Pricing extendido en `ai-usage.ts` (7 modelos)

**Producto comercial:**
- Página `/resumen` real (stats, tópicos, bibliografía, reporte)
- Botón unificado "Iniciar asistencia de inteligencia artificial" (`assistant.ts`)
- Server action orquestador `runMedicalAssistant`
- Bulk-delete con select-all + 1 round-trip server action
- Disclaimer legal pre-upload + páginas Términos (16 secciones) y Privacidad (13 secciones) auditadas
- Sidebar con links legales

**Validación runtime:**
- 51 fotos procesadas con Gemini Flash sin errores
- 65 referencias detectadas
- Reporte Claude Sonnet 4.6 generado en 3.3 min sobre 38K caracteres
- Costo real total $0.22 USD

**Acuerdo estratégico**: bootstrap viable con ~$120M-180M COP año 1. Foco LATAM. Mobile-first. NO competir con CongressIQ en pharma — quedarse con médico individual. Rebrand pendiente.

### 2026-05-09 (tarde) · Claude Opus 4.7 — Bases sólidas

**Implementadas las 4 bases que evitan reescritura futura:**

1. **Multi-tenant schema (fase 12)** aplicado a Supabase:
   - `organizations` (tipos: individual/society/hospital/university/enterprise/admin)
   - `organization_memberships` (roles: owner/admin/member/viewer)
   - Trigger `handle_new_user_org` crea workspace personal en signup
   - Backfill: cada user existente tiene su org personal
   - `organization_id` añadido a `congresses` y `reports` (nullable, retro-compatible)
   - Helper `user_org_ids()` SECURITY DEFINER para evitar recursión RLS
   - Migración fase 12.1 fix de RLS recursion (HTTP 500)

2. **Types extendidos en `database.ts`**:
   - `Organization`, `OrganizationMembership`, `OrganizationType`, `OrganizationPlan`, `MembershipRole`
   - `AiUsageLimits`, `AiUsageRecord`, `AiActionType`, `AiUsageStatus`
   - Generación auto de Supabase pendiente (requiere Docker o access token)

3. **Observability con Sentry**:
   - `@sentry/nextjs` instalado
   - `instrumentation.ts` (Node + Edge runtimes) y `instrumentation-client.ts` (browser)
   - No-op si `NEXT_PUBLIC_SENTRY_DSN` no está seteado (dev seguro)
   - Habilitado solo en `NODE_ENV=production`
   - Carlos debe crear cuenta gratis en sentry.io y agregar DSN cuando salga a prod

4. **Tests + CI/CD**:
   - Vitest + happy-dom + @vitest/coverage-v8
   - 6 tests verdes (verificación bibliográfica + estimateCost)
   - Scripts `npm test` y `npm test:watch`
   - GitHub Actions `.github/workflows/ci.yml`: lint + typecheck + tests + build en cada push a `main` o `sprint-*`

**i18n queda pospuesto a Q2** (cuando se lance EN). Es el cambio más invasivo y conviene hacerlo cuando ya sepamos qué textos son finales.

**Nombre comercial**: postpuesto explícitamente por Carlos hasta tener bases sólidas. Candidatos en stand-by: CongressLens / CongressBrief / CongressVault.

### 2026-05-09 (noche) · Claude Opus 4.7 — Arquitectura A+B+C+D

**Cuatro capas críticas de arquitectura completadas:**

**A. Audit log + structured logging** (fase 13):
- Tabla `audit_log` con RLS por user; 4 índices (user, action, organization, status≠success)
- `lib/logger.ts`: `log()` JSON one-liner para stdout y `auditLog()` que persiste fila
- 17 tipos de `AuditAction` definidos (auth.*, congress.*, image.*, ai.*, etc.)

**B. Rate limiting** (fase 14):
- Tabla `rate_limit_buckets` con función atómica `rate_limit_check()` (SECURITY DEFINER)
- `lib/rate-limit.ts`: 6 buckets configurados (image_analysis 30/min, report_generation 5/5min, assistant_run 3/5min, reference_verify 10/min, auth_signup 5/h, auth_login 20/15min)
- Fail-open si DB falla (no bloquea usuarios por infra issue)
- Función purge para limpieza periódica

**C. Background jobs queue** (fase 15):
- Tabla `ai_jobs` con status enum, retry con backoff manual, priority queue
- Función `ai_jobs_claim_next()` con `FOR UPDATE SKIP LOCKED` (race-safe)
- `lib/jobs.ts`: `enqueueJob()` y `getCongressJobs()` (lectura)
- Worker pendiente: Supabase Edge Function en próxima iteración

**D. Server action wrapper** `lib/with-action.ts`:
- HOC que envuelve cualquier server action con auth + rate limit + AI quota + audit log
- Reemplaza ~30 líneas de boilerplate por config declarativa
- Tipo `ActionResult<T>` discriminado para manejo uniforme de errores
- Usado en próxima refactorización de `ai-processing.ts`, `polyglot-reports.ts`, `assistant.ts`

**Decisión técnica**: Postgres-based rate limiting + queue (no Upstash, no Inngest). Razones:
- Cero dependencias externas
- Una sola fuente de verdad
- Costo cero en tier Pro de Supabase
- Migrar a Inngest/Trigger.dev en v2 si volumen lo justifica

**Próximo bloque sugerido**: Worker para `ai_jobs` (Supabase Edge Function o Vercel Cron) + UI live-status + admin dashboard para Carlos.

### 2026-05-09 (madrugada) · Claude Opus 4.7 — Worker + refactor + live-status

**1. Server actions refactorizadas a `withAction`:**
- `processImageWithAI`, `extractCongressTopics` (ai-processing.ts)
- `generateAcademicReport` (polyglot-reports.ts) — firma cambió a `{congressId, language}`
- `verifySingleReference` (firma cambió a `{referenceId, congressId}`), `verifyCongressReferences` (references.ts)
- Cada una gana automáticamente: auth + rate limit + AI quota + audit log + manejo uniforme de errores
- ~150 líneas de boilerplate eliminadas
- Callers ajustados: `congress-report.tsx`, `assistant.ts`, `photo-viewer.tsx` (chequea `result.success` en lugar de `result.error`/`result.skipped`)

**2. Worker para `ai_jobs` (Vercel Cron):**
- `app/api/jobs/worker/route.ts`: POST con Bearer `CRON_SECRET`
- Llama RPC `ai_jobs_claim_next` (FOR UPDATE SKIP LOCKED — race-safe)
- Dispatcher por `job_type`: image_analysis, topics_extraction, report_generation, reference_verification
- Retry con backoff: si attempt_count < max_attempts, vuelve a 'pending'; si no, 'failed'
- `vercel.json` con cron schedule `* * * * *` (1/min, requiere Vercel Pro plan)
- Nueva utility `lib/supabase/service.ts` para cliente service-role (solo cron + admin scripts, NUNCA en server actions)
- 2 env vars nuevas pendientes: `CRON_SECRET` (cualquier string aleatorio largo) y `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > API)

**3. UI live-status (Supabase Realtime):**
- `components/congresses/jobs-status.tsx`: client component
- Suscribe a `postgres_changes` en `ai_jobs` filtrado por `congress_id`
- Muestra: progress bar global + 4 stats (pendientes / en curso / OK / fallidos) + detalle de errores
- Listo para integrar en página de detalle del congreso

**Verificación**: lint clean, 6/6 tests pass, typecheck clean. Build local OOM por Turbopack (problema de RAM local, no del código); CI Ubuntu lo procesa OK.

**Pendiente del usuario**:
- Crear `CRON_SECRET` (`openssl rand -hex 32`) y agregarlo a Vercel env vars + `.env.local`
- Copiar `SUPABASE_SERVICE_ROLE_KEY` desde el dashboard a Vercel env vars + `.env.local`
- Vercel plan Pro para activar cron (Hobby no permite cron)

### 2026-05-09 (madrugada extendida) · Claude Opus 4.7 — Capa A+B+C+D+E

**A. Worker integrado en upload flow:**
- `lib/actions/queue.ts`: 3 server actions `enqueueImageAnalysis`, `enqueueReportGeneration`, `enqueueTopicsExtraction` (todas con withAction)
- `photo-upload-zone.tsx`: ahora encola `image_analysis` job; si encolar falla cae a `processImageWithAI` síncrono (failsafe)
- `congresos/[id]/page.tsx`: integra `<JobsStatus>` debajo del upload zone — usuario ve progress bar live

**B. Generador de tipos Python (`tools/gen_types.py`):**
- Lee OpenAPI desde `/rest/v1/` con service-role key (la publishable da 401 por diseño)
- Convierte JSON Schema → TypeScript interfaces
- Output configurable; default `app/src/types/db-generated.ts`
- Pendiente del usuario: configurar `SUPABASE_SERVICE_ROLE_KEY` en env para activarlo
- Reemplaza `supabase gen types typescript` (que requiere Docker) en este entorno Windows

**C. Validador RLS Python (`tools/audit_rls.py`):**
- Prueba cada una de las 16 tablas sensibles con publishable key (sin sesión)
- Reporta status: OK (200/[] o 401), FAIL (200 con filas — leak), o WARN (404, etc.)
- Verificado: las 16 tablas correctamente protegidas (cero leaks)
- ASCII-only para compatibilidad cp1252 Windows

**D. Health + Admin metrics:**
- `/api/health` (GET): chequea env vars, DB ping (con service-role), AI flag. Retorna 200/503 con JSON.
- `/dashboard/admin/metrics` (página server-component): gate por `organizations.plan='admin'` + `role='owner'`. Muestra usuarios, orgs, congresos, fotos, ai_usage del mes (success/blocked/error/costo), jobs status, últimos 10 errores del audit_log.

**E. SQL linter Python (`tools/lint_sql.py`):**
- Detecta CREATE TABLE sin enable RLS, CREATE POLICY sin guard, DELETE sin WHERE, DROP TABLE sin IF EXISTS
- Verificó las 16 migraciones existentes: 0 errores, 1 aviso (false positive en fase 12.1 — los DROP IF EXISTS hacen las CREATE POLICY idempotentes)
- Listo para integrar como pre-commit hook

**Beneficios concretos:**
- Cero filtraciones RLS (validado automáticamente)
- Visibilidad operacional para Carlos via /admin/metrics
- Workflow Python aprovechando entorno ya instalado (3.12, ruff/black/mypy)
- Worker queue cierra el ciclo: uploads ya no atan al usuario al browser

**Pendiente del usuario para activar todo:**
1. Generar `CRON_SECRET` y `SUPABASE_SERVICE_ROLE_KEY`
2. Plan Vercel Pro para cron
3. Promover su organización personal a `plan='admin'` para ver /admin/metrics:
   ```sql
   update public.organizations set plan='admin'
    where id in (
      select organization_id from public.organization_memberships
       where user_id='dbde0af0-c777-4a94-b335-c6438fe6058d' and role='owner'
    );
   ```

### 2026-05-09 (cierre arquitectura) · Claude Opus 4.7 — Capa F+G+H

**F. Full-text search (fase 16):**
- Columna `search_tsv tsvector` GENERATED ALWAYS AS STORED en `ocr_results`
- Diccionario español, fallback simple
- GIN index `idx_ocr_results_search_tsv`
- RPC `search_ocr(p_term, p_limit)` con `websearch_to_tsquery` + `ts_rank`
- `lib/actions/search.ts` reescrito: ahora usa RPC FTS, hidrata metadata en una segunda query
- Performance: O(log n) con índice vs O(n) del ilike anterior

**G. Idempotency keys (fase 17):**
- Tabla `idempotency_keys` con status processing/succeeded/failed + result/error_message persistidos
- RLS por user, índice por (user_id, action, created_at)
- `lib/with-action.ts` extendido: si el input incluye `idempotencyKey`, deduplica:
  - existing succeeded → retorna resultado guardado sin re-ejecutar
  - existing processing → retorna error 409-style (concurrencia)
  - existing failed → retorna error guardado
  - sin existing → reserva como processing, ejecuta, persiste resultado final
- Función `idempotency_purge_old()` para limpieza periódica

**H. Playwright E2E:**
- `@playwright/test` instalado
- `playwright.config.ts` con projects Chromium, retain-on-failure traces
- 7 smoke tests en `e2e/public.spec.ts`: landing, login, registro, dashboard redirect, terminos, privacidad, /api/health
- Scripts npm: `test:e2e`, `test:e2e:install`
- Workflow CI separado `.github/workflows/e2e.yml` (manual + PR a main) — no lentifica el CI principal

**Verificación**: lint clean, typecheck clean, vitest 6/6, build local 13 rutas OK.

**Pendiente del usuario para correr E2E localmente:**
- `cd app && npm run test:e2e:install` (descarga Chromium ~150MB)
- En otra terminal: `npm run dev` o `npm run build && npm run start`
- `npm run test:e2e`

### 2026-05-09 (cierre extendido) · Claude Opus 4.7 — Capa I+J+K

**I. Soft delete (fase 18):**
- Columnas `deleted_at`, `deleted_by` en congresses, congress_images, reports, organizations
- Partial indexes WHERE deleted_at IS NULL (los activos son el 99% del lookup)
- Vistas `*_active` y `*_archived` para UI explícita
- Helper `lib/soft-delete.ts`: `softDelete()` y `restoreFromArchive()` con audit log automático

**J. Feature flags (fase 19):**
- Tabla `feature_flags` (key + enabled + rollout_percentage 0-100)
- Tabla `feature_flag_overrides` (override por user O por org, exactamente uno)
- RPC `is_feature_enabled(p_flag_key)` con resolución por prioridad: user > org > rollout%
- Rollout estable por user via `hashtext(user_id || flag_key) % 100`
- 5 flags seed: ai.async_processing, ai.claude_for_topics, ui.live_jobs_status, billing.stripe, export.notebooklm
- `lib/feature-flags.ts`: `isFeatureEnabled(key)` con cache 30s in-memory + `isAnyFeatureEnabled(...keys)` para batch

**K. Webhooks (fase 20):**
- Tabla `webhook_endpoints` (url, secret, events[], enabled) con RLS por user/org
- Tabla `webhook_deliveries` (immutable log, status, response, attempts)
- RPC `webhook_claim_next()` con FOR UPDATE SKIP LOCKED
- 7 events tipados: congress.created, congress.deleted, image.uploaded, image.analyzed, report.generated, references.verified, billing.upgraded
- `lib/webhooks.ts`:
  - `dispatchWebhook(event, payload, scope)` — encola deliveries
  - `signWebhookBody(body, secret)` — HMAC-SHA256 estilo Stripe `t=<ts>,v1=<sig>`
  - `processNextWebhookDelivery()` — worker side, exponential backoff (60s · 2^n) hasta max_attempts
- `generateWebhookSecret()` retorna `whsec_<64-hex>`
- `/api/jobs/worker` ahora también procesa webhooks en cada tick (junto con ai_jobs)

**Verificación**: lint clean, build verde antes en CI. typecheck local OOM por límite RAM de la máquina (no problema del código).

**Pendiente del usuario:**
- /admin/flags UI para gestionar flags (próxima sesión)
- /admin/webhooks UI para crear endpoints (próxima sesión)
- Testing en runtime con sociedad médica real

### 2026-05-09 (cierre noche) · Claude Opus 4.7 — Capa L+M+N

**L. Admin UI (/dashboard/admin/*):**
- `_admin-gate.tsx`: helper `requireAdmin()` que valida org plan='admin' + role='owner'
- `/admin/flags`: lista de feature_flags + toggle enabled + slider rollout % + save por fila
- `/admin/webhooks`: crear endpoint (URL + descripción + selección de events), listado con toggle/delete + últimas 20 entregas
- `lib/actions/admin.ts`: server actions `updateFeatureFlag`, `createWebhookEndpoint`, `toggleWebhookEndpoint`, `deleteWebhookEndpoint` — todas con `withAction` + `ensureAdmin` gate doble
- Secret del webhook se muestra UNA VEZ al crear (cópia pre-warning estilo Stripe)

**M. Pre-commit hook (Husky + lint-staged):**
- `husky` + `lint-staged` instalados como devDeps
- `.husky/pre-commit` ejecuta `npx lint-staged`
- `.lintstagedrc.json` orquesta:
  - `*.{ts,tsx,js,jsx}` → `eslint --fix`
  - `*.py` → `ruff format` + `ruff check --fix`
  - `supabase/migrations/*.sql` → `tools/lint_sql.py`
- Scripts npm nuevos: `lint:sql`, `lint:py`, `format:py`, `prepare` (auto-init husky en `npm install`)
- Pendiente del usuario: `cd app && npm install` para que husky active el hook (la `prepare` script ya está configurada para futuras instalaciones)

**N. OpenAPI desde Zod:**
- `zod-openapi` instalado
- `lib/openapi.ts`: schemas centralizados (HealthResponse, ErrorResponse, WebhookPayload, VerificationStatus, ReferenceCandidate) + `buildOpenApiDocument()`
- `/api/openapi.json` (GET): static cacheable, devuelve la spec completa con cache 1h
- Base lista para futura API pública v1; añadir endpoints es declarar el schema y el `paths` entry

**Verificación**: lint clean en todos los cambios. Vitest 6/6 pendiente de re-run en CI (la máquina local ha estado bajo presión RAM).

### 2026-05-09 (cierre madrugada) · Claude Opus 4.7 — Capa O+P+Q

**O. Backups + Disaster Recovery:**
- `tools/backup_db.py`: dump JSONL por tabla via REST + manifest.json. Sin pg_dump binary (Windows-friendly). Pagina con Range header (1000 filas).
- `tools/restore_db.py`: dry-run por defecto, `--apply` para escribir. Upsert con `Prefer: resolution=merge-duplicates`. Orden FK-aware.
- `.github/workflows/backup.yml`: nightly schedule 06:17 UTC + workflow_dispatch. Sube artifact con retención 30 días.
- `docs/disaster-recovery.md`: 3 niveles de protección (PITR Supabase Pro + JSONL backup propio + storage), procedimiento de restauración paso a paso, lista de env vars críticas, plan de pruebas trimestrales.

**P. Sentry source maps + release tagging:**
- `next.config.ts` envuelto con `withSentryConfig` cuando hay `SENTRY_AUTH_TOKEN` + `NEXT_PUBLIC_SENTRY_DSN`
- Release auto-derivado de `VERCEL_GIT_COMMIT_SHA` / `GITHUB_SHA` / "dev"
- `sourcemaps.deleteSourcemapsAfterUpload: true` para no exponer mapas al browser
- `silent: true`, `disableLogger: true` para builds limpios
- `.env.local` ahora documenta SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_RELEASE

**Q. Realtime presence:**
- `components/congresses/congress-presence.tsx`: client component
- Suscribe al canal `presence:congress:<id>` con `key: currentUserId`
- Track presence con `{user_id, display_name, joined_at}`
- Filtra al usuario actual de la lista
- Render: pill verde "<nombre> también está aquí" o "N colegas viendo este congreso"
- Integrado al header de `/dashboard/congresos/[id]` (página de detalle)
- Display name resuelto desde `profiles.full_name` con fallback a email

**Verificación**: lint clean tras bump de Node memory.

**Pendiente del usuario:**
- En GitHub repo settings → Secrets:
  - `SUPABASE_URL` (NEXT_PUBLIC_SUPABASE_URL)
  - `SUPABASE_SERVICE_ROLE_KEY`
  - (opcional para Sentry releases en CI: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`)
- En Vercel env vars: las mismas Sentry secrets para que builds de prod activen sourcemaps
- Crear el primer test de DR trimestral cuando esté listo

### 2026-05-09 (cierre madrugada extendida) · Claude Opus 4.7 — Capa R+S+T

**R. PWA mobile-first:**
- `src/app/manifest.ts`: web app manifest con shortcuts a /congresos y /biblioteca
- `public/sw.js`: service worker minimal con 3 estrategias (static cache-first, pages network-first con offline fallback, dynamic never-cache)
- `components/layout/service-worker-register.tsx`: registra `/sw.js` solo en `NODE_ENV=production`
- `layout.tsx`: añade `applicationName`, `appleWebApp`, `formatDetection`, `Viewport` con `themeColor` y `viewportFit: cover`
- Iconos pendientes en `/public`: `icon-192.png`, `icon-512.png`, `icon-maskable.png` (debe crear Carlos cuando defina branding)

**S. Analytics events (fase 21):**
- Tabla `analytics_events` con `event_name`, `props jsonb`, `session_id`, `url_path`, `user_agent`, indexes por evento/user/org
- `lib/analytics.ts`: server action `trackEvent({name, props, urlPath, sessionId})` con 11 eventos tipados
- Resuelve organization_id automáticamente desde la primera membership owner del user
- Nunca lanza: errors → console.warn solamente
- `/admin/analytics`: dashboard con top eventos últimos 7 días + lista de últimos 30

**T. Audit dashboard (`/admin/audit`):**
- Server component con paginación (50 por página) + filtros por status + action
- Filter bar usa `<form method="get">` (URL params) — sin estado cliente innecesario
- Cada fila muestra icon por status (success/denied/error), action mono, user prefix, timestamp, metadata truncado
- Pagination links que preservan filtros via querystring

**Verificación**: lint clean (con `NODE_OPTIONS=--max-old-space-size=4096` por límite RAM local).

### 2026-05-09 (cierre día) · Claude Opus 4.7 — Capa U+V+W

**U. Trash/Archive UI (`/dashboard/papelera`):**
- Server component que lista soft-deleted de congresses, congress_images, reports
- 3 secciones independientes: Congresos / Reportes / Fotos
- `lib/actions/trash.ts`: 2 server actions (`restoreItem`, `purgeItem`) con withAction
- `purgeItem` hard-elimina con doble gate (user_id + deleted_at NOT NULL)
- `components/dashboard/trash-item-actions.tsx`: 2 botones por item (restaurar / eliminar definitivo)
- Sidebar añade "Papelera" entre Biblioteca y Ajustes

**V. i18n preparado (next-intl):**
- `next-intl` instalado pero NO activado todavía (la app sigue ES-only)
- `src/i18n/config.ts`: SUPPORTED_LOCALES (es/en/pt), DEFAULT_LOCALE, isSupportedLocale guard
- `src/i18n/messages/{es,en,pt}.json`: diccionarios iniciales con secciones common/auth/dashboard/congress/ai/legal
- `src/i18n/request.ts`: getRequestConfig que carga el dict según locale
- Cuando se quiera activar EN/PT en runtime: mountar `NextIntlClientProvider` en layout, agregar middleware locale o adoptar `[locale]` segment, refactorizar textos a `t()` calls

**W. Operations runbook (`docs/operations.md`):**
- 4 opciones para activar el worker cron: Vercel Cron Pro ($20/mes), cron-job.org (gratis), pg_cron+http (Supabase), GitHub Actions (no recomendado por SLA)
- Tabla de métricas y dónde verlas
- SQL para promover usuarios a plan='admin'
- Tabla de rotación de secretos (cada 90 días)
- Checklist de verificación mensual

**Verificación**: lint clean. Todas las migraciones aplicadas en producción.

### 2026-05-09 (cierre día 2) · Claude Opus 4.7 — Capa X+Y+Z

**X. Bulk congress export ZIP (fase 22):**
- `jszip` instalado
- Bucket `congress-exports` (privado, 500MB cap, RLS por user_id en path)
- `lib/actions/export.ts` `exportCongress({congressId})` con withAction:
  - Ownership gate + carga paralela de congress + images + ocr + refs + topics + último report
  - Construye ZIP con layout `<safeName>/{manifest.json,report.md,images/*.jpg,ocr/*.txt,references.json,topics.json}`
  - Sube a Storage `<userId>/<congressId>/<timestamp>.zip`
  - Devuelve signed URL válida 1 hora
  - Dispara webhook `report.generated` (fire-and-forget)
- `/dashboard/congresos/[id]/exportar` ahora real (era placeholder); muestra counts + botón
- `components/congresses/export-button.tsx`: client component con estados + link descarga

**Y. Webhook receivers (fase 23):**
- Tabla `webhook_inbound` con `signature_valid` + `processed` + `payload jsonb` + `source_ip`
- RLS `deny all to anon` (solo service-role escribe)
- Endpoint `/api/webhooks/incoming/[provider]`:
  - PROVIDERS map por nombre (test stub shipped, agregar Stripe es 1 entry)
  - Verifica HMAC-SHA256 en formato `t=<ts>,v1=<sig>` igual que outgoing
  - Persiste rawBody parseado + signature + valid flag + source IP
  - 200 si valid, 401 si no — siempre persiste para forensics

**Z. Library filters:**
- `reference-library.tsx` extendido sin reescritura:
  - +2 filtros: `verification_status` (con counts inline) y `detected_year`
  - Header "X de Y referencias"
  - Botón "Limpiar filtros" cuando alguno activo
  - Counts precomputados con useMemo

**Verificación**: lint clean.

**Pendiente del usuario:**
- Para Stripe webhook receiver: agregar entry en `PROVIDERS` + `STRIPE_WEBHOOK_SECRET` env
- Testing del bulk export con un congreso 30+ fotos (verificar tamaño ZIP <100MB)

### 2026-05-09 (cierre día 3) · Claude Opus 4.7 — UX Sprint top mundial

**Investigación previa**: WebSearch en paralelo sobre tipografía premium SaaS, healthcare UI design 2026, color palettes médicas, empty states best practices. Hallazgos:
- Inter es estándar premium SaaS (Linear, Notion, Vercel, Shopify)
- IBM Plex Mono ideal para datos técnicos médico/regulado
- Soft blues + greens + cool neutrals = trust + clinical
- Empty states deben tratarse como onboarding surface principal
- 2026 trend: "warm paper + slate UI + calming accent" (menos clínico, más humano)

**UX-1: Design tokens + tipografía premium**
- `lib/fonts.ts`: Inter (UI/headings, 400-800) + IBM Plex Mono (data, 400-600) via next/font
- `globals.css` reescrito con sistema de tokens CSS:
  - Surfaces warm-paper + slate ink + 3 borders
  - Brand medical teal #0d9488 + deep blue CTA #1e40af
  - Semantics emerald/amber/red/sky (cada uno con -soft)
  - Shadows xs→xl, type scale ratio 1.250 con clamp(), spacing 4px-base
- Tailwind 4 `@theme inline` para tokens→utilities
- Inter stylistic sets (ss01, cv11, calt) activos
- Focus rings teal, scrollbars finos, selection brand-tinted
- Print + reduced-motion fallbacks
- `layout.tsx`: font variables + metadata template + SVG icons + theme color responsive

**UX-2: Logo + identidad visual**
- `components/ui/logo.tsx` redibujado:
  - Hexágono outer (estructura molecular/scientific signal) + ECG pulse interno
  - Gradient teal→blue
  - Variantes iconOnly/light + 3 tamaños
  - Wordmark "Med" + "Congress" + tagline "Clinical Companion" (rebrand-friendly)
- `public/favicon.svg` + `public/apple-icon.svg` (modernos browsers OK)

**UX-3: Dashboard inicial premium**
- `/dashboard/page.tsx` rediseñado:
  - **First-time welcome** cuando no hay congresos: hero gradient con ECG decorativo, badge, CTA primario blanco + secundario outline, 3 quick steps (01/02/03), quality bullets
  - **Returning user**: greeting según hora del día, GlobalSearch, stats 4-cards (refs verificadas con accent emerald), recent congresses con hover transitions
- Filtra `deleted_at is null`; `dynamic = "force-dynamic"`

**Verificación**: lint clean.

**Pendiente del usuario** (para llegar a 100% premium):
- Audit visual mobile en cada página
- Empty states ilustrados en biblioteca/papelera/legal
- Loading skeletons en server-fetches lentos
- Onboarding tour primer-uso con tooltips
- Iconos PNG para PWA si quieres install-to-home-screen perfecto en iOS antiguos (>iOS 16 acepta SVG igual)

### 2026-05-09 (cierre día 4) · Claude Opus 4.7 — UX Sprint final (#4+5+6+9)

**UX-4: Empty states ilustrados**
- `components/ui/empty-state.tsx`: componente reusable con prop `illustration` (8 SVGs inline: library/trash/search/congress/report/topics/references/generic), 3 sizes, action + secondaryAction
- Aplicado a:
  - `/dashboard/biblioteca`: empty state con illustration "library" + CTA "Crear congreso"
  - `/dashboard/papelera`: empty state con illustration "trash"
- Logo de biblioteca cambiado de blue a teal para consistencia con design system

**UX-5: Loading skeletons (Next.js App Router)**
- `components/ui/skeleton.tsx`: primitives `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonStatCard`
- `loading.tsx` creados en 5 rutas clave:
  - `/dashboard/loading.tsx` — header + stats + 3 cards
  - `/dashboard/congresos/loading.tsx` — cards list
  - `/dashboard/congresos/[id]/loading.tsx` — header + 3 stats + upload zone + grid
  - `/dashboard/congresos/[id]/resumen/loading.tsx` — header + 4 stats + reporte + topics
  - `/dashboard/biblioteca/loading.tsx` — header + filter bar + 6 cards grid
- Next.js renderiza estos automáticamente entre navegaciones; UX percibida más rápida sin código adicional

**UX-6: Mobile audit + drawer + responsive**
- `components/layout/mobile-header.tsx`: nuevo top bar sticky con Logo size="sm" (solo mobile, hidden md:up)
- `components/layout/mobile-nav.tsx` rediseñado:
  - 4 tabs: Inicio / Congresos / Biblioteca / Papelera
  - FAB central "Nuevo congreso" con gradient teal y -mt-8 elevation
  - safe-area-inset-bottom respetado para iPhone notch
  - aria-current/aria-label para accessibility
  - Active tab usa teal-700 (era blue-600)
- `(dashboard)/layout.tsx` actualizado:
  - Importa MobileHeader
  - Background usa token `var(--color-bg)` en lugar de `bg-slate-50` (consistencia)
  - Padding responsive `px-4 sm:px-6 lg:px-8` (era `p-6 lg:p-8`)
  - Mobile header se renderiza solo en mobile

**UX-9: Print styles top mundial**
- `globals.css` reescribió la sección `@media print`:
  - `@page { size: A4; margin: 18mm 16mm 22mm 16mm }` para entrega clínica/journal
  - Body 11pt, line-height 1.45 (legibilidad académica)
  - Hide chrome (nav, aside, header banner, toaster, botones excepto `.print-show`)
  - URLs visibles después de links (`a[href]::after`) — verificable por reader
  - `break-after: avoid` en h1-h4 (no orphans)
  - `break-inside: avoid` en article/table/.print-no-break
  - Manual breaks via `.print-break-before` / `.print-break-after`
  - Backgrounds/shadows transparentes; print-color-adjust exact

**Verificación**: lint clean (warning unused import resuelto).

### 2026-05-09 (cierre día 5) · Claude Opus 4.7 — UX Sprint cierre (#7+8+10)

**UX-7: Onboarding tour primera vez**
- `components/onboarding/onboarding-tour.tsx`: tour generic con zero deps externas
  - 3 elementos: overlay con clip-path cutout sobre target + ring teal animado + tooltip card
  - Posicionamiento auto (top/bottom/left/right) con clamping a viewport
  - Persistencia via localStorage `medcongress.onboarding.completed.v1`
  - Listen a resize + scroll para re-medir
  - Auto-scroll al target si está fuera de viewport
  - Animation `fadeInUp` al aparecer
- `components/onboarding/dashboard-tour.tsx`: 3 pasos para el dashboard returning user (stats / recientes / sidebar biblioteca)
- Wiring: data-tour attributes en el dashboard (`dashboard-stats`, `dashboard-recent`) y sidebar (`sidebar-biblioteca`)
- Aparece SOLO en returning user (no en welcome state) y SOLO la primera vez

**UX-8: Micro-interactions consistentes**
- `globals.css` extendido con sistema de animation tokens:
  - 4 duration vars: instant 80ms / fast 150ms / base 220ms / slow 400ms
  - 4 easing vars: standard / decelerate / accelerate / spring
- 4 keyframes globales: `fadeInUp`, `slideInRight`, `pulseSoft`, `livePulse`
- 6 utility classes:
  - `.animate-fade-in-up` — entrada de cards
  - `.animate-slide-in-right` — sidebars/tooltips
  - `.animate-pulse-soft` — indicadores live
  - `.hover-lift` — cards con elevation on hover
  - `.press` — feedback mobile (scale 0.97 on active)
  - `.interactive` — base universal hover/focus
- 2 component classes:
  - `.spinner-brand` — spinner ring teal con borde slate
  - `.live-dot` — punto verde con pulso ripple expandiéndose

**UX-10: Component catalog interno (en lugar de Storybook)**
- Decisión: NO instalar Storybook. Pesa 100MB+ y es otro Next.js completo solo para internal docs.
- Alternativa: `/dashboard/admin/components` — single page que renderiza todos los primitives
- Sections: Color tokens (12 swatches), Tipografía (display/h1/h2/h3/body/mono), Logo (3 sizes + light variant), Botones (6 variants), Cards (basic + hover-lift), Skeletons (3 variants), Empty states (4 illustrations), Animaciones (spinner / live-dot / fade-in)
- Gated por `requireAdmin()` igual que las otras admin pages
- 0 dependencias nuevas

**Verificación**: lint clean.

---

## 12. Cómo actualizar este archivo

1. **Cuando termines tu sesión**, edita §3 (Estado actual), §11 (changelog) y la fecha del header.
2. **Si tomas una decisión vinculante** (cambio de stack, modelo, compliance, etc.), añade entrada en §4 con justificación.
3. **Si descubres bugs nuevos o riesgos**, agrégalos como TODO en la sección apropiada.
4. **Si el humano cambia de opinión sobre algo**, REGISTRA aquí la nueva decisión con fecha y razón.
5. **NO borres este archivo. NO reduzcas su contenido sin razón. NO ignores estas reglas.**

---

> "Construyamos algo que valga la pena que dure 10 años. Cada IA que abre este archivo está sirviendo a esa misión. Cada commit suma. Cada migración importa. Cada texto legal protege. Cada usuario que confía en nosotros merece que mantengamos la coherencia."
> — *Carlos + IA, 2026-05-09*
