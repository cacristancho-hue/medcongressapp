#!/usr/bin/env python
"""Audit RLS posture by hitting every public table with an unauthenticated
publishable key.

Pass criterion: tables with sensitive data must return either:
  - HTTP 401 (auth required by API gateway), or
  - HTTP 200 with [] (RLS allows but no rows visible).

Tables that return HTTP 200 with rows would be a serious leak. The script
flags any case it sees.

Usage:
    python tools/audit_rls.py \
        --url https://<ref>.supabase.co \
        --key <publishable-or-anon-key>
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


# Tables known to contain user-private data. If any returns rows without
# auth, that's a hard fail. RLS or anon-key policy must block them.
SENSITIVE_TABLES = [
    "profiles",
    "congresses",
    "congress_images",
    "ocr_results",
    "topics",
    "image_topics",
    "references",
    "reference_candidates",
    "reports",
    "ai_usage",
    "ai_usage_limits",
    "organizations",
    "organization_memberships",
    "audit_log",
    "rate_limit_buckets",
    "ai_jobs",
]


def probe(url: str, key: str, table: str, timeout: int = 10) -> tuple[int, int]:
    """Return (status_code, row_count). row_count is -1 if not parseable."""
    full = f"{url.rstrip('/')}/rest/v1/{table}?select=*&limit=10"
    req = Request(full, headers={"apikey": key, "Authorization": f"Bearer {key}"})
    try:
        with urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            try:
                data = json.loads(body)
                count = len(data) if isinstance(data, list) else -1
            except Exception:
                count = -1
            return resp.status, count
    except HTTPError as e:
        return e.code, -1
    except URLError as e:
        print(f"  [WARN] {table}: connection error {e.reason}", file=sys.stderr)
        return -1, -1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=os.environ.get("NEXT_PUBLIC_SUPABASE_URL"))
    parser.add_argument("--key", default=os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
    args = parser.parse_args()

    if not args.url or not args.key:
        print("Falta --url o --key", file=sys.stderr)
        return 2

    print(f"Auditando RLS en {args.url} con publishable key (sin sesión)\n")

    fails: list[str] = []
    warnings: list[str] = []

    for table in SENSITIVE_TABLES:
        status, count = probe(args.url, args.key, table)
        marker = "[OK]"
        note = ""

        if status == 200 and count > 0:
            marker = "[FAIL]"
            fails.append(f"{table} expone {count} filas sin auth")
            note = f" leak: {count} filas visibles"
        elif status == 200 and count == 0:
            marker = "[OK]"
            note = " RLS OK (filtra a 0 filas sin sesión)"
        elif status == 401:
            marker = "[OK]"
            note = " 401 OK (gateway exige auth)"
        elif status == 404:
            marker = "?"
            warnings.append(f"{table} 404 (¿no existe?)")
            note = " 404 (revisar)"
        else:
            marker = "?"
            warnings.append(f"{table} status inesperado {status}")
            note = f" status {status}"

        print(f"  {marker} {table:<32}{note}")

    print()
    if fails:
        print(f"FAIL: {len(fails)} tabla(s) con leak:")
        for f in fails:
            print(f"  - {f}")
        return 1
    if warnings:
        print(f"OK con avisos: {len(warnings)} tabla(s) requieren revisión:")
        for w in warnings:
            print(f"  - {w}")
        return 0
    print("OK: todas las tablas sensibles correctamente protegidas.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
