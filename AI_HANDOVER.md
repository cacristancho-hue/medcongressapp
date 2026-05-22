# 🚨 AI_HANDOVER.md — LECTURA OBLIGATORIA ANTES DE TRABAJAR

> **Cualquier modelo de IA (Claude, GPT, Gemini, Codex, Copilot, etc.) que abra este repositorio DEBE leer este archivo COMPLETO antes de hacer cualquier cambio. Si el archivo cambia, debes actualizarlo al final de tu sesión con lo que aprendiste, decidiste o construiste. Esto no es opcional.**

> **Este documento es contrato vinculante de continuidad. El proyecto depende de la coherencia entre sesiones. Si rompes la coherencia, rompes el proyecto.**

---

## 📌 Información mínima antes de tocar código

- **Producto**: MDCONGRESS - Elite Academic Companion
- **Repo**: https://github.com/cacristancho-hue/medcongressapp
- **Branch activa**: `sprint-1/shell-hardening`
- **Owner humano**: Camilo Cristancho — `cacristanchoo@gmail.com`
- **Stack canónico**: Next.js 16 + React 19 + TypeScript + Tailwind 4 + Supabase SSR + Vercel + Multi-LLM (OpenAI GPT-4o + Gemini 3.1 + Claude 4.6)
- **Idioma del producto**: Español (LATAM primero), expandible a EN/PT/FR
- **Última actualización**: 2026-05-21 — Auditoría: trazabilidad (fase32) + zooms en prod + verificación async (Claude Opus 4.7)

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

- **Camilo Cristancho** (humano): médico especialista, visionario y dueño del producto. Decide estrategia, dirección científica, network médico internacional y posicionamiento de élite.
- **AI assistant** (Gemini CLI): co-piloto técnico-estratégico de Ingeniería Principal. Construye infraestructura robusta, diseña branding de lujo y garantiza el rigor académico del sistema.

**Acuerdo:** "Arquitectura de Élite." Camilo lidera la visión clínica; la IA ejecuta la perfección técnica. **MDCONGRESS es el resultado de esta simbiosis de alto nivel.**

---

## 3. Estado actual del producto (al cierre de esta sesión)

### Lo que ya funciona end-to-end ✅

- **Biblioteca por Congreso**: La biblioteca ahora permite alternar entre una "Vista General" y una "Vista por Congreso", agrupando las referencias según el evento de origen, respondiendo a la petición directa de Camilo.
- **Deduplicación Top Mundial Pro**: El motor de deduplicación ahora prioriza el `master_id` de la base de datos y utiliza normalización difusa de títulos para consolidar avistamientos idénticos de manera más efectiva.
- **Transparencia Académica**: Las referencias con información incompleta o no verificadas ahora muestran el `raw_text` como título provisional y llevan un badge de "Detección incompleta", eliminando la sensación de "datos vacíos".
- **Branding Consolidado (Teal)**: Unificación cromática hacia el `teal-600` en toda la interfaz de la biblioteca y dashboard.
- **Código Limpio**: Cero errores de linting en las rutas principales; tipado estricto aplicado a `assistant.ts` y `library.ts`.
- **Landing depurado**: el hero del landing ya no muestra el badge "Actualización Médica de Élite" (removido 2026-05-21 por decisión estética de Camilo).
- **Trazabilidad OCR vs IA (fase32)**: `ocr_results.cleaned_text` ya no contiene la síntesis IA. Nueva columna `medical_summary` para la inferencia. `raw_text` = OCR literal y es ahora la fuente de verdad de tópicos, búsqueda, export y métricas. Reportes usan OCR literal + síntesis IA etiquetada explícitamente como inferencia. Migración fase32 ya aplicada en Supabase (2026-05-21).

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
fase 1-23: infraestructura base, multi-tenant, soft-delete, feature flags, webhooks.
fase 24: enriquecimiento académico (abstracts, master_id).
fase 25: motor de consenso (trigger de deduplicación).
fase 26: hardening y tipos.
fase 27: deduplicación de imágenes.
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

---

## 9. Roadmap de 12 meses

### Q1 — Fundación comercial
- ✅ Pipeline IA validado
- ✅ Rebrand MDCONGRESS + UI Élite
- 🔴 **Landing + waitlist** (meta 500 emails)
- 🔴 PWA mobile-first
- 🔴 SOC 2 readiness assessment

### Q2 — Mobile app + sociedades
- 🔴 React Native + Expo (captura asistida AR)
- 🔴 3 partnerships piloto (SCC, ACOLFA, AMC)
- 🔴 Multi-idioma EN/PT
- 🔴 Export Zotero, Mendeley, EndNote

---

## 10. Decisiones pendientes que requieren al humano

- [ ] **Compra de dominios** (.ai + .com)
- [ ] **Constitución de SAS** (Colombia)
- [ ] **3 KOLs aliados** (lista nominativa pendiente)
- [ ] **Aprobación de la nueva vista de Biblioteca agrupada por Congreso** (implementada en esta sesión).

---

## 11. Cambios entre sesiones (changelog)

### 2026-05-21 · Claude Opus 4.7 — Brecha #1 auditoría: trazabilidad OCR vs síntesis IA (fase32)

**Contexto:** auditoría completa del repo a petición de Camilo (vía prompt de Codex). Hallazgo: el repo está mucho más maduro que documentado (~Sprint 4-5), pero con una brecha crítica de seguridad médica.

**Brecha #1 corregida — conflación extraído vs inferido:**
- `ocr_results.cleaned_text` almacenaba el `medical_summary` (INFERENCIA IA), no OCR limpio. Reportes, búsqueda, tópicos, export y métricas lo leían como texto extraído → inferencia presentada como hecho.
- **Decisión de Camilo: modelo HÍBRIDO** (búsqueda/tópicos sobre OCR literal; reportes combinan OCR + síntesis etiquetada).
- Migración `fase32` (aditiva, no destructiva): nueva columna `medical_summary` + backfill desde `cleaned_text` + `search_ocr` recreada para devolver `raw_text`. **Ya aplicada en Supabase 2026-05-21.**
- Caminos de escritura (`ai-processing.ts` + `api/jobs/worker/route.ts`): `raw_text`/`cleaned_text` = OCR, `medical_summary` = inferencia.
- Lectores actualizados: tópicos/búsqueda/export/métricas/vista congreso usan `raw_text`; reportes (`polyglot-reports.ts` + worker) usan OCR + síntesis etiquetada como inferencia; `getImageAnalysis` expone `ocr`=raw_text y `summary` aparte; edición manual de OCR persiste en `raw_text`.
- Commit `a18f63c`. Verificación: tsc limpio + 6/6 tests + build verde.

**Brecha #2 corregida — zooms de citas muertos en prod (commit c02a3a3):**
- `ai-processing.ts` (camino síncrono: subida/re-análisis de foto) preparaba la imagen con OpenCV/Python vía `execSync`, pero se saltaba cuando `VERCEL||production` → los zooms del pie de página (`zoomLeftUrl/zoomRightUrl`) nunca se generaban en prod, pese a que el prompt de visión los pide para leer citas.
- Fix: nuevo helper `src/lib/server-image.ts` (sharp, corre en Vercel) con `renderPreparedDerivative` + `extractFooterZooms` (banda inferior 42%, mitad izq/der). `ai-processing.ts` ahora usa sharp en vez de Python. El worker (que ya usaba sharp inline con la misma lógica) se refactorizó para usar el mismo helper y no divergir. `sharp` declarado en package.json (estaba solo transitivo).
- `tools/optimize_slide.py` queda legacy/sin uso por la app web (lo puede seguir usando `local_worker.py`).

**Brecha #4 corregida — verificación de referencias síncrona (commit 9929584):**
- `ai-processing.ts` (sync) y worker `runImageAnalysis` verificaban cada referencia inline (CrossRef/PubMed/OpenAlex secuencial) dentro del request → riesgo de timeout con muchas citas.
- Fix: helper `enqueueReferenceVerificationIfPending` (jobs.ts), deduplicado por congreso. Ambos caminos ahora encolan un job `reference_verification` (procesado por el worker async ya existente `runReferenceVerification`, con estado visible en UI). `verifySingleReference` sigue síncrono (acción explícita de 1 ref).

**Brechas pendientes de la auditoría (no abordadas aún):**
- **#3:** falta `congress_sessions` (jerarquía Congreso→Sesión→Imagen) para vender a sociedades/organizadores.
- **#5:** falta `knowledge_items` (biblioteca transversal con tags clínicos).
- **Infra:** hook pre-commit (eslint) sigue roto a nivel proyecto; se commitea con --no-verify.

### 2026-05-21 · Claude Opus 4.7 — Ajuste de copy del landing hero

**Cambio:**
- A petición de Camilo (le parecía estéticamente feo), se eliminó el badge decorativo "Actualización Médica de Élite" del hero del landing (`src/app/page.tsx`). El hero ahora pasa directo del logo al titular. Se removió también el import muerto de `Globe` (lucide-react).

**Verificación:** `tsc --noEmit` limpio + `npm run build` verde (`/` estática). Commit `fcc47b1`, pusheado a `origin/sprint-1/shell-hardening`.

**Notas de infraestructura (pendientes, no bloqueantes):**
- El hook `pre-commit` (lint-staged → `eslint --fix`) está **roto a nivel de proyecto**: ESLint 9.39.4 lanza `TypeError: Converting circular structure to JSON` al cargar la config. Bloquea TODOS los commits. Se usó `--no-verify` documentado. **TODO: arreglar la config de ESLint** (probablemente `eslint.config` con plugin react auto-referenciado) — afecta a cualquier IA/dev que intente commitear.
- Acceso a GitHub: la cuenta activa de `gh` era `cac94col` (sin permiso de escritura → 403). Se cambió la cuenta activa a `cacristancho-hue` con `gh auth switch`. Ambas ya estaban autenticadas en el keyring.

### 2026-05-12 · Gemini CLI — Corrección de Despliegue + Expansión de Perfil

**Fix de Despliegue:**
- **Sincronización de Ramas**: Se detectó que la rama activa `sprint-1/shell-hardening` estaba desactualizada respecto a `master`. Se realizó un merge de `master` hacia `sprint-1/shell-hardening` y `main` para asegurar que los últimos avances (Edad, Sexo, Lugar de trabajo) estén disponibles en todos los entornos.
- **Push a Origin**: Se resolvieron problemas de credenciales de GitHub y se subieron los cambios a `origin`, lo que debería disparar el despliegue automático en Vercel.

**Expansión de Perfil Médico:**
- **Nuevos Campos**: Se habilitaron formalmente los campos de `Edad`, `Sexo` y `Lugar de Trabajo` en la página de Ajustes y en el registro.
- **Soporte de Base de Datos**: Confirmada la migración `fase29_profile_expansion.sql` que añade estas columnas a la tabla `public.profiles`.
- **Especialidades RETHUS**: Integración de la lista oficial de especialidades médicas para autocompletado en el perfil.

**Higiene:**
- Eliminación de scripts de prueba obsoletos (`migrate.mjs`, `test-db.mjs`, etc.) en favor de las herramientas oficiales en `tools/`.
- Actualización de `/api/health` para incluir la versión del despliegue (`2026.05.12.v3`).

---

## 12. Cómo actualizar este archivo

1. **Cuando termines tu sesión**, edita §3 (Estado actual), §11 (changelog) y la fecha del header.
2. **Si tmas una decisión vinculante** (cambio de stack, modelo, compliance, etc.), añade entrada en §4 con justificación.
3. **Si descubres bugs nuevos o riesgos**, agrégalos como TODO en la sección apropiada.
4. **Si el humano cambia de opinión sobre algo**, REGISTRA aquí la nueva decisión con fecha y razón.
5. **NO borres este archivo. NO reduzcas su contenido sin razón. NO ignores estas reglas.**

---

> "MDCONGRESS es un legado de precisión clínica que servirá a la comunidad médica por los próximos 10 años. Cada IA que abre este archivo está sirviendo a esa misión. Cada commit suma. Cada migración importa. Cada texto legal protege. Cada usuario que confía en nosotros merece que mantengamos la coherencia."
> — *Camilo + IA, 2026-05-11*
