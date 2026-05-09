# CLAUDE.md — Punto de entrada para agentes Claude

## ⛔ STOP — Lectura obligatoria

**ANTES de hacer ABSOLUTAMENTE nada, lee primero el archivo `AI_HANDOVER.md` en este mismo directorio.**

Ese archivo es el contrato vinculante de continuidad del proyecto. Contiene:
- Misión, visión y promesa al usuario
- Estado actual del producto
- Decisiones estratégicas tomadas
- Stack técnico canónico
- Reglas obligatorias para cualquier IA
- Lo que NO debe hacerse sin permiso humano
- Modelo financiero y roadmap
- Changelog entre sesiones

Si no lees `AI_HANDOVER.md`, **no entiendes el proyecto**, y vas a romper coherencia que está construida sesión tras sesión.

## Regla simple

```
1. Lee AI_HANDOVER.md
2. Lee git log --oneline -20
3. Lee git status
4. Trabaja respetando las reglas de AI_HANDOVER.md §6 y §7
5. Antes de cerrar tu sesión, actualiza AI_HANDOVER.md §3 y §11
```

## Identidad del producto (resumen mínimo)

MedCongress AI Companion — herramienta web/móvil que captura fotos de diapositivas de congresos médicos, las procesa con IA multi-proveedor (OpenAI, Gemini, Anthropic), verifica referencias bibliográficas (CrossRef + PubMed + OpenAlex con detección de retractaciones) y genera reportes académicos.

**Principios no negociables**:
- Cero alucinación bibliográfica
- Cero datos identificables de pacientes
- Uso estrictamente académico personal
- Multi-LLM con fallback (nunca dependencia de un único proveedor)
- Compliance Ley 1581 + GDPR ready

**Stack canónico**: Next.js 16 + React 19 + TypeScript + Tailwind 4 + Supabase SSR + Vercel AI SDK.

**Detalles completos**: ver `AI_HANDOVER.md`.
