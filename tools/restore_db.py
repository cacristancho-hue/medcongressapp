#!/usr/bin/env python
"""Restore from a backup created by backup_db.py.

DRY-RUN BY DEFAULT. Pass --apply explicitly to actually write rows.

Strategy:
  - Reads each *.jsonl in the given backup dir
  - Inserts rows via Supabase REST with `Prefer: resolution=merge-duplicates`
    (UPSERT on primary key)
  - Order matters for FKs: same as BACKUP_TABLES list

This is the disaster path. Day-to-day "undo" should use soft delete instead.

Usage:
    # Inspect what would happen:
    python app/tools/restore_db.py --in backups/2026-05-09T180000Z

    # Actually run it:
    python app/tools/restore_db.py --in backups/2026-05-09T180000Z \
        --url https://<ref>.supabase.co \
        --key $SUPABASE_SERVICE_ROLE_KEY \
        --apply
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


RESTORE_ORDER = [
    "profiles",
    "organizations",
    "organization_memberships",
    "feature_flags",
    "feature_flag_overrides",
    "ai_usage_limits",
    "congresses",
    "congress_images",
    "ocr_results",
    "topics",
    "image_topics",
    "reference_candidates",
    "reports",
    "ai_usage",
    "audit_log",
    "webhook_endpoints",
    "webhook_deliveries",
    "ai_jobs",
    "idempotency_keys",
]

BATCH = 100


def upsert_batch(url: str, key: str, table: str, rows: list[dict]) -> tuple[int, str | None]:
    if not rows:
        return 0, None
    body = json.dumps(rows, ensure_ascii=False).encode("utf-8")
    full = f"{url.rstrip('/')}/rest/v1/{table}"
    req = Request(
        full,
        method="POST",
        data=body,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    try:
        with urlopen(req, timeout=60) as resp:
            return len(rows), None
    except HTTPError as e:
        return 0, f"HTTP {e.code}: {e.read().decode('utf-8', errors='replace')[:200]}"
    except Exception as e:
        return 0, f"{type(e).__name__}: {e}"


def restore_table(url: str, key: str, table: str, jsonl_path: Path, apply: bool) -> tuple[int, str | None]:
    rows: list[dict] = []
    total = 0
    with jsonl_path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))

    if not rows:
        return 0, None

    if not apply:
        return len(rows), None  # dry-run

    inserted = 0
    for i in range(0, len(rows), BATCH):
        batch = rows[i : i + BATCH]
        n, err = upsert_batch(url, key, table, batch)
        if err:
            return inserted, err
        inserted += n
    return inserted, None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--in", dest="src", required=True, help="Carpeta con jsonl + manifest.json")
    parser.add_argument("--url", default=os.environ.get("NEXT_PUBLIC_SUPABASE_URL"))
    parser.add_argument("--key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Sin esta bandera el script solo cuenta filas (dry-run).",
    )
    args = parser.parse_args()

    src = Path(args.src)
    if not src.exists() or not src.is_dir():
        print(f"No existe: {src}", file=sys.stderr)
        return 2

    if args.apply and (not args.url or not args.key):
        print("Para --apply necesitas --url y --key.", file=sys.stderr)
        return 2

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"[{mode}] Restaurando desde {src}\n")

    failed = []
    for table in RESTORE_ORDER:
        path = src / f"{table}.jsonl"
        if not path.exists():
            print(f"  [SKIP] {table:<32} (no en backup)")
            continue
        n, err = restore_table(args.url or "", args.key or "", table, path, args.apply)
        if err:
            print(f"  [FAIL] {table:<32} {err}")
            failed.append(table)
        else:
            verb = "insertaría" if not args.apply else "insertó"
            print(f"  [OK]   {table:<32} {verb} {n} filas")

    print()
    if failed:
        print(f"FAIL: {len(failed)} tabla(s).")
        return 1
    if not args.apply:
        print("DRY-RUN OK. Re-ejecuta con --apply para escribir.")
    else:
        print("APPLY OK. Verifica con audit_rls + tu app.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
