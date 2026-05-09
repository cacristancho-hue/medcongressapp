# Operational tooling (Python 3.12+)

Scripts auxiliares para mantenimiento y verificación del proyecto MedCongress.
Requieren Python 3.12 con stdlib (sin dependencias externas — usan `urllib`).

## Setup

Estos scripts se ejecutan desde la raíz del workspace (donde vive `.venv/`):

```bash
# desde C:/Users/Usuario/Desktop/MEDDCONGRESSAPP
.venv/Scripts/python.exe app/tools/<script>.py [args]
```

Variables de entorno reconocidas (la mayoría se pueden leer de `app/.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Scripts

### `audit_rls.py` — Validador de Row Level Security

Hace ping a cada tabla pública con la publishable key (sin sesión). Las tablas
sensibles deben devolver `[]` (RLS filtró) o `401` (gateway exigió auth). Si
alguna devuelve filas reales, hay un leak crítico.

```bash
.venv/Scripts/python.exe app/tools/audit_rls.py \
  --url https://<ref>.supabase.co \
  --key <publishable-or-anon-key>
```

Exit code: 0 si todo OK, 1 si encuentra leaks.

### `gen_types.py` — Generador de tipos TypeScript

Reemplaza `supabase gen types typescript` (que requiere Docker en Windows).
Lee el OpenAPI schema desde `/rest/v1/` y produce un archivo TS con
interfaces para cada tabla pública.

```bash
.venv/Scripts/python.exe app/tools/gen_types.py \
  --url https://<ref>.supabase.co \
  --key $SUPABASE_SERVICE_ROLE_KEY \
  --out app/src/types/db-generated.ts
```

Necesita la **service-role** key (no la publishable — Supabase devuelve 401
para el endpoint OpenAPI con keys públicas, por diseño).

### `lint_sql.py` — Linter de migraciones SQL

Verifica problemas comunes en archivos `supabase/migrations/*.sql`:

- `CREATE TABLE` sin `enable row level security` posterior
- `CREATE POLICY` sin guard `if not exists` (causa fallos en re-ejecuciones)
- `DELETE FROM <tabla>;` sin WHERE (riesgo destructivo)
- `DROP TABLE` sin `IF EXISTS`

```bash
.venv/Scripts/python.exe app/tools/lint_sql.py
# o con archivos específicos
.venv/Scripts/python.exe app/tools/lint_sql.py app/supabase/migrations/20260509000007_*.sql
```

Exit code: 0 si ningún error (avisos no bloquean), 1 si hay errores.

## Integración futura

Estos scripts pueden integrarse a:

- `npm test` (mediante `pre`/`post` hooks o `npm run lint:sql`)
- GitHub Actions (`.github/workflows/ci.yml` — añadir step Python)
- Pre-commit hook (con [pre-commit](https://pre-commit.com/) o husky)
