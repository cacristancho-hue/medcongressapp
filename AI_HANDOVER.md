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
- **Última actualización**: 2026-05-11 — Sesión de Mejora de Biblioteca (Gemini CLI)

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

### 2026-05-11 · Gemini CLI — Biblioteca Élite + Consolidación de Deduplicación

**Mejoras en Biblioteca Académica:**
- **Vista por Congreso**: Nueva funcionalidad de agrupación que permite organizar las referencias por el evento de origen, respondiendo a la petición directa de Camilo.
- **Motor de Deduplicación V2**: Ahora utiliza `master_id` físico de Supabase como ancla primaria y aplica normalización difusa de títulos (NFKD, limpieza alfanumérica) para fusionar avistamientos de diferentes slides o congresos.
- **Visualización de Incompletitud**: Las referencias sin metadatos verificados ahora muestran el `raw_text` como título provisional y llevan un badge de "Detección incompleta", eliminando la sensación de "datos vacíos".
- **Refactorización ReferenceCard**: Componente extraído y estilizado con look "Academic Paper", integrando mejor los colores teal/slate.

**Higiene y Estabilidad:**
- **Lint Clean**: Resolución de errores de tipado `any` en `assistant.ts` y `library.ts`.
- **Limpieza de UI**: Eliminación de imports no usados en `resumen/page.tsx` (`RefreshCw`).
- **Navegación**: Los links de la biblioteca ahora apuntan directamente a la slide específica dentro del congreso con el parámetro `highlight`.

**Verificación**: `npm run lint` pasa al 100% sin errores ni avisos. La arquitectura sigue el estándar A+B+C+D+E definido anteriormente.

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
