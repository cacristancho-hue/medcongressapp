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
