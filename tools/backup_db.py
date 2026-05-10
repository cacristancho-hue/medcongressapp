#!/usr/bin/env python
"""Disaster-recovery backup script for Supabase data.

Strategy:
  1. Supabase Pro already runs daily PITR backups (we inherit those).
  2. This script adds a *user-data* layer on top: dumps each public table
     as JSONL into a timestamped folder. Useful for self-serve recovery,
     audits, or migrating to another Postgres.

Why JSONL and not pg_dump:
  - Works without the pg_dump binary (Windows-friendly out of the box)
  - Output is plain JSON; trivially diff-able and re-importable
  - Streams via REST so we never materialize the whole DB in memory

Usage:
    python app/tools/backup_db.py \
        --url https://<ref>.supabase.co \
        --key $SUPABASE_SERVICE_ROLE_KEY \
        --out backups/$(date +%Y-%m-%d)

Exit code 0 on full success, 1 if any table failed to dump.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


# Tables to back up. Order is irrelevant for the dump itself; matters only
# for restore (FKs). The restore script we ship later uses this same order.
BACKUP_TABLES = [
    "profiles",
    "organizations",
    "organization_memberships",
    "congresses",
    "congress_images",
    "ocr_results",
    "topics",
    "image_topics",
    "reference_candidates",
    "reports",
    "ai_usage_limits",
    "ai_usage",
    "audit_log",
    "feature_flags",
    "feature_flag_overrides",
    "webhook_endpoints",
    "webhook_deliveries",
    "ai_jobs",
    "idempotency_keys",
]

# Page size for the REST range header. Supabase default cap is 1000.
PAGE = 1000


def fetch_page(url: str, key: str, table: str, offset: int) -> tuple[list[dict], int]:
    """Return (rows, total_count). Total comes from Content-Range header."""
    full = f"{url.rstrip('/')}/rest/v1/{table}?select=*"
    req = Request(
        full,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Range-Unit": "items",
            "Range": f"{offset}-{offset + PAGE - 1}",
            "Prefer": "count=exact",
        },
    )
    with urlopen(req, timeout=60) as resp:
        body = resp.read().decode("utf-8")
        rows = json.loads(body)
        content_range = resp.headers.get("Content-Range", "")
        # Format: "0-999/12345"
        total = -1
        if "/" in content_range:
            try:
                total = int(content_range.split("/")[1])
            except ValueError:
                total = -1
        return rows, total


def dump_table(url: str, key: str, table: str, out_dir: Path) -> tuple[int, str | None]:
    """Stream a table to JSONL. Returns (row_count, error_or_none)."""
    out_path = out_dir / f"{table}.jsonl"
    total_known = -1
    written = 0
    try:
        with out_path.open("w", encoding="utf-8") as f:
            offset = 0
            while True:
                rows, total = fetch_page(url, key, table, offset)
                if total_known < 0:
                    total_known = total
                for row in rows:
                    f.write(json.dumps(row, ensure_ascii=False) + "\n")
                    written += 1
                if not rows or len(rows) < PAGE:
                    break
                offset += PAGE
        return written, None
    except HTTPError as e:
        if e.code == 404:
            # Table doesn't exist: not an error, just skip.
            out_path.unlink(missing_ok=True)
            return 0, f"missing"
        return written, f"HTTP {e.code}"
    except Exception as e:
        return written, f"{type(e).__name__}: {e}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=os.environ.get("NEXT_PUBLIC_SUPABASE_URL"))
    parser.add_argument(
        "--key",
        default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"),
        help="Service-role key (la publishable solo verá lo que RLS permite, dump incompleto).",
    )
    parser.add_argument(
        "--out",
        default=f"backups/{datetime.utcnow().strftime('%Y-%m-%dT%H%M%SZ')}",
        help="Carpeta destino. Default: backups/<UTC-timestamp>.",
    )
    args = parser.parse_args()

    if not args.url or not args.key:
        print("Falta --url o --key (o variables de entorno).", file=sys.stderr)
        return 2

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Backup destino: {out_dir}\n")

    failed = []
    summary = []
    for table in BACKUP_TABLES:
        rows, err = dump_table(args.url, args.key, table, out_dir)
        if err and err != "missing":
            print(f"  [FAIL] {table:<32} {err}")
            failed.append(table)
        elif err == "missing":
            print(f"  [SKIP] {table:<32} (no existe)")
        else:
            print(f"  [OK]   {table:<32} {rows:>6} filas")
            summary.append({"table": table, "rows": rows})

    # Manifest
    manifest = {
        "version": 1,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "supabase_url": args.url,
        "tables": summary,
        "failed_tables": failed,
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print()
    if failed:
        print(f"FAIL: {len(failed)} tabla(s) fallaron — ver mensajes arriba.")
        return 1
    total_rows = sum(t["rows"] for t in summary)
    print(f"OK: {len(summary)} tabla(s), {total_rows} filas, manifest.json escrito.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
