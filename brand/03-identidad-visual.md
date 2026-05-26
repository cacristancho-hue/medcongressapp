# 03 · Identidad visual

> Tokens tomados del código real (`src/app/globals.css`, `src/lib/fonts.ts`, `md-logo.tsx`).
> Asume **Teal como primario** (ver decisión #1 en el README).

## Logo / Isotipo
- **Isotipo:** bloque monolítico tipo "diapositiva premium" (formato ~16:9) con las letras **MD**
  esculpidas, biselado de cristal y un barrido láser esmeralda (procesamiento IA). Archivo: `md-logo.tsx`.
- **Wordmark:** la palabra **CONGRESS** en IBM Plex Mono, extra-negrita, `tracking` amplio.
- **Versiones de ícono:** `favicon.svg`, `apple-icon.svg`, y PNG `icon-192/512` + `icon-maskable-512` (PWA/tiendas).

**Uso del logo**
- Espacio de protección: al menos la altura de la "M" alrededor del isotipo.
- En móvil, el wordmark "CONGRESS" puede ocultarse y dejar solo el isotipo.
- No deformar, no rotar, no cambiarle la paleta fuera de las variantes aprobadas.
- ⚠️ **Pendiente:** hoy el isotipo es azul (#020617→#1E40AF) mientras la UI es teal. Decisión #1:
  recolorar a teal/slate para coherencia, o mantener azul como "marca heredada".

## Paleta cromática (tokens reales)

| Rol | Nombre | HEX | Token CSS | Uso |
|---|---|---|---|---|
| **Marca / primario** | Teal médico | `#0d9488` | `--color-brand` | CTAs, acentos, estado activo |
| Marca hover | Teal profundo | `#0f766e` | `--color-brand-hover` | hover de CTAs |
| Marca suave | Teal claro | `#ccfbf1` | `--color-brand-soft` | fondos sutiles, chips |
| **Secundario / confianza** | Azul real | `#1e40af` | `--color-primary` | logo, enlaces, confianza |
| **Señal IA / verificado** | Esmeralda | `#34d399` | — | láser IA, "verificado" (solo señal) |
| Texto principal | Pizarra | `#0f172a` | `--color-fg` | titulares, texto |
| Texto medio | Slate-600 | `#475569` | `--color-fg-muted` | párrafos secundarios |
| Texto sutil | Slate-400 | `#94a3b8` | `--color-fg-subtle` | metadatos |
| Fondo | Papel cálido | `#fafaf9` | `--color-bg` | fondo general |
| Superficie | Blanco | `#ffffff` | `--color-bg-elevated` | tarjetas |
| Borde | Slate-200 | `#e2e8f0` | `--color-border` | divisores, bordes |

**Regla de color:** Teal manda en acción; Azul aporta confianza/heritage; Esmeralda **solo** comunica
"IA activa / verificado"; el resto es escala de pizarra sobre papel cálido. Evitar introducir colores nuevos.

## Tipografía
- **Inter** — UI, titulares, cuerpo (`--font-sans` / `--font-display`).
- **IBM Plex Mono** — wordmark "CONGRESS", datos técnicos, etiquetas mono (`--font-mono`).
- Jerarquía: titulares `font-bold`/`font-black` tracking ajustado; cuerpo regular; etiquetas mono en
  mayúsculas con tracking amplio para el sello "élite".

## Forma y profundidad
- **Radios:** `--radius-sm` 0.375rem · `--radius-md` (tarjetas). Botones redondeados (pill en CTAs primarios).
- **Sombras:** suaves, basadas en pizarra translúcida (`--shadow-sm/md`). Nada de sombras duras.
- Estética: minimalismo de papel cálido + acentos teal, mucho aire, líneas finas.

## Iconografía
- **lucide-react** (línea, peso medio). Coherente, sin mezclar sets de íconos.
- Tamaños comunes: 3.5–4 (inline), 4–5 (encabezados de tarjeta).

## Don'ts visuales
- ❌ Gradientes llamativos o "neón" fuera del láser del logo.
- ❌ Emojis en superficies de producto serias (sí permitidos con moderación en marketing).
- ❌ Mezclar azul y teal como si fueran lo mismo: cada uno tiene su rol.
- ❌ Logos de terceros mal proporcionados (caso OpenAI: se retiró el ícono incorrecto).
