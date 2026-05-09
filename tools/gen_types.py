#!/usr/bin/env python
"""Generate TypeScript interfaces from a Supabase project's REST schema.

Avoids the Docker requirement of `supabase gen types`. Uses the public
PostgREST OpenAPI document that every Supabase project exposes at /rest/v1/.

Usage:
    python tools/gen_types.py \
        --url https://<ref>.supabase.co \
        --key <publishable-or-anon-key> \
        --out app/src/types/db-generated.ts

The script is read-only: it reads the schema and writes a TypeScript file.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen


PG_TO_TS = {
    "uuid": "string",
    "text": "string",
    "varchar": "string",
    "character varying": "string",
    "char": "string",
    "json": "Record<string, unknown>",
    "jsonb": "Record<string, unknown>",
    "boolean": "boolean",
    "bool": "boolean",
    "integer": "number",
    "int": "number",
    "int2": "number",
    "int4": "number",
    "int8": "number",
    "smallint": "number",
    "bigint": "number",
    "numeric": "number",
    "real": "number",
    "double precision": "number",
    "float": "number",
    "float4": "number",
    "float8": "number",
    "date": "string",
    "timestamp": "string",
    "timestamptz": "string",
    "timestamp with time zone": "string",
    "timestamp without time zone": "string",
    "time": "string",
    "bytea": "string",
}


def pg_to_ts(pg_type: str, nullable: bool) -> str:
    base = PG_TO_TS.get(pg_type.lower(), "unknown")
    return f"{base} | null" if nullable else base


def fetch_openapi(url: str, key: str) -> dict[str, Any]:
    req = Request(
        url.rstrip("/") + "/rest/v1/",
        headers={"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/openapi+json"},
    )
    with urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def to_pascal(snake: str) -> str:
    return "".join(part.capitalize() for part in snake.split("_"))


def render(schema: dict[str, Any]) -> str:
    definitions = schema.get("definitions", {})
    lines: list[str] = [
        "// THIS FILE IS AUTO-GENERATED. Do not edit by hand.",
        "// Source: tools/gen_types.py from the Supabase REST OpenAPI spec.",
        f"// Generated: {datetime.utcnow().isoformat()}Z",
        "",
    ]
    for table_name in sorted(definitions.keys()):
        table = definitions[table_name]
        properties: dict[str, dict[str, Any]] = table.get("properties", {})
        if not properties:
            continue
        required: set[str] = set(table.get("required", []))
        type_name = to_pascal(table_name)
        lines.append(f"export interface {type_name}Row {{")
        for col_name in sorted(properties.keys()):
            col = properties[col_name]
            pg_format = col.get("format") or col.get("type") or "unknown"
            nullable = col_name not in required
            ts_type = pg_to_ts(pg_format, nullable)
            optional_marker = "?" if nullable else ""
            lines.append(f"  {col_name}{optional_marker}: {ts_type}")
        lines.append("}")
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=os.environ.get("NEXT_PUBLIC_SUPABASE_URL"))
    parser.add_argument(
        "--key",
        default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"),
        help="Supabase service-role secret key (NO la publishable). Sin ella el OpenAPI schema responde 401.",
    )
    parser.add_argument("--out", default="app/src/types/db-generated.ts")
    args = parser.parse_args()

    if not args.url or not args.key:
        print(
            "Falta --url o --key (o variables de entorno NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
            file=sys.stderr,
        )
        return 2

    schema = fetch_openapi(args.url, args.key)
    output = render(schema)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(output, encoding="utf-8")
    print(f"OK: {out_path} ({len(output.splitlines())} líneas)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
