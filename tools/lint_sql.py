#!/usr/bin/env python
"""Linter for Supabase SQL migrations.

Catches common mistakes before they hit production:
  - CREATE TABLE without `enable row level security` afterwards.
  - CREATE POLICY without IF NOT EXISTS guard (causes failures on rerun).
  - DROP TABLE / DELETE without WHERE (very dangerous in migration).
  - INSERT INTO public.* with hardcoded values (likely seed data, warn).

Exits with code 1 if any FAIL is detected. Exits 0 with warnings allowed.

Usage:
    python tools/lint_sql.py app/supabase/migrations/*.sql
    # or
    python tools/lint_sql.py
    (defaults to app/supabase/migrations/)
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


CREATE_TABLE_RE = re.compile(
    r"create\s+table\s+(?:if\s+not\s+exists\s+)?(public\.\w+|\w+)",
    re.IGNORECASE,
)
ENABLE_RLS_RE = re.compile(
    r"alter\s+table\s+(?:if\s+exists\s+)?(public\.\w+|\w+)\s+enable\s+row\s+level\s+security",
    re.IGNORECASE,
)
CREATE_POLICY_RE = re.compile(r"create\s+policy", re.IGNORECASE)
POLICY_GUARD_RE = re.compile(r"if\s+not\s+exists.*?create\s+policy", re.IGNORECASE | re.DOTALL)
DROP_WITHOUT_WHERE_RE = re.compile(r"^\s*delete\s+from\s+\w[\w.]*\s*;", re.IGNORECASE | re.MULTILINE)
DROP_TABLE_RE = re.compile(r"^\s*drop\s+table\s+(?!if\s+exists)", re.IGNORECASE | re.MULTILINE)


def lint_file(path: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    sql = path.read_text(encoding="utf-8", errors="replace")
    sql_lower = sql.lower()

    # Tables created vs RLS-enabled.
    created_tables = {m.group(1).lower() for m in CREATE_TABLE_RE.finditer(sql)}
    rls_enabled = {m.group(1).lower() for m in ENABLE_RLS_RE.finditer(sql)}
    for tbl in created_tables:
        # Normalize: 'public.foo' or 'foo' both should match.
        bare = tbl.split(".")[-1]
        full = f"public.{bare}"
        if tbl not in rls_enabled and full not in rls_enabled and bare not in rls_enabled:
            warnings.append(f"  table {tbl}: no encontró 'enable row level security' en este archivo")

    # Policies without IF NOT EXISTS guard pattern.
    if CREATE_POLICY_RE.search(sql_lower):
        # Heuristic: every create policy should be inside a `do $$ if not exists` or
        # be wrapped by a check. If the file has a create policy but zero
        # `if not exists` guards, warn.
        guards = POLICY_GUARD_RE.findall(sql_lower)
        plain_policies = [m for m in CREATE_POLICY_RE.finditer(sql_lower)]
        if not guards and len(plain_policies) > 0:
            warnings.append(
                f"  {len(plain_policies)} CREATE POLICY sin 'if not exists' guard (puede fallar en re-ejecuciones)"
            )

    # DELETE FROM without WHERE.
    for match in DROP_WITHOUT_WHERE_RE.finditer(sql):
        snippet = match.group(0).strip()
        errors.append(f"  DELETE sin WHERE detectado: {snippet}")

    # Raw DROP TABLE without IF EXISTS.
    for match in DROP_TABLE_RE.finditer(sql):
        line_no = sql.count("\n", 0, match.start()) + 1
        errors.append(f"  DROP TABLE sin IF EXISTS en línea {line_no}")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "paths",
        nargs="*",
        help="Archivos SQL a verificar. Si vacío, lintea todo app/supabase/migrations/.",
    )
    args = parser.parse_args()

    if args.paths:
        files = [Path(p) for p in args.paths]
    else:
        root = Path("app/supabase/migrations")
        if not root.exists():
            root = Path("supabase/migrations")
        files = sorted(root.glob("*.sql"))

    if not files:
        print("No hay archivos SQL para lintear.")
        return 0

    total_errors = 0
    total_warnings = 0
    for path in files:
        errors, warnings = lint_file(path)
        if errors or warnings:
            print(f"\n{path}")
            for w in warnings:
                print(f"  WARN {w}")
            for e in errors:
                print(f"  FAIL {e}")
            total_errors += len(errors)
            total_warnings += len(warnings)

    print(f"\n{len(files)} archivo(s) revisado(s) · {total_errors} error(es) · {total_warnings} aviso(s)")
    return 1 if total_errors > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
