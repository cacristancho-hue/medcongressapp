# Sistema de Marca MDCONGRESS

Esta carpeta es la **fuente canónica** de la identidad de marca de MDCONGRESS.
Reemplaza y organiza el antiguo `BRANDING_STRATEGY.md` (V1.1, queda como histórico).

## Documentos

| # | Documento | Qué define |
|---|---|---|
| 01 | [Estrategia de marca](01-estrategia-de-marca.md) | Misión, visión, posicionamiento, audiencia, personalidad, valores |
| 02 | [Identidad verbal](02-identidad-verbal.md) | Nombre, tagline, tono de voz, mensajes clave, boilerplate, qué decir / qué no |
| 03 | [Identidad visual](03-identidad-visual.md) | Logo, paleta (tokens reales), tipografía, iconografía, uso |

(Pendientes de escribir, en orden de prioridad: 04-aplicaciones (social, email, plantillas),
05-fotografia-e-imagineria, 06-checklist-de-marca.)

## Auditoría inicial (2026-05-26) — estado encontrado

**Ya existe y es coherente:**
- Nombre: **MDCONGRESS**. Wordmark "CONGRESS" en IBM Plex Mono, tracking amplio.
- Tipografía: **Inter** (UI/display) + **IBM Plex Mono** (marca/código). Implementada.
- Logo: isotipo "diapositiva monolítica" con letras MD. Implementado (`md-logo.tsx`).
- Tono académico/élite ya aplicado en landing y legales.

**Incoherencia a resolver (decisión #1):**
- La estrategia V1.1 declaraba **Azul Real (#1E40AF) + Esmeralda (#34D399)** como paleta.
- El código evolucionó a **Teal #0d9488 como color de marca** (`--color-brand` en `globals.css`;
  CTAs, selector de idioma, planes usan teal).
- **Pero el logo sigue en azul** (#020617 → #1E40AF).
- → Hoy la marca está "partida": logo azul, UI teal, IA esmeralda. **Hay que elegir un primario.**

**Recomendación del auditor:** adoptar **Teal #0d9488 como color primario de marca** (más
diferenciado: el sector médico está saturado de azul), dejar **Azul #1e40af como secundario/confianza**,
y reservar **Esmeralda #34d399 exclusivamente como señal de "IA activa / verificado"**. Esto implica
**recolorar el logo** hacia teal (o teal+slate) en una próxima iteración. Ver detalle en 03.

> Esta decisión está pendiente de confirmación de Camilo. Los documentos 02 y 03 están escritos
> asumiendo Teal-primario; si se decide mantener Azul-primario, se ajustan.
