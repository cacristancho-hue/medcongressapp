# AGENTS.md — Punto de entrada para agentes Codex / Cursor / OpenAI

## ⛔ STOP — Lectura obligatoria

**ANTES de hacer ABSOLUTAMENTE nada, lee primero el archivo `AI_HANDOVER.md` en este mismo directorio.**

`AI_HANDOVER.md` es el contrato vinculante de continuidad del proyecto. Contiene:
- Misión, visión y promesa al usuario
- Estado actual del producto
- Decisiones estratégicas tomadas
- Stack técnico canónico
- Reglas obligatorias para cualquier IA
- Lo que NO debe hacerse sin permiso humano
- Modelo financiero y roadmap
- Changelog entre sesiones

Si no lees `AI_HANDOVER.md`, **no entiendes el proyecto**.

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

**Detalles completos**: ver `AI_HANDOVER.md`.
