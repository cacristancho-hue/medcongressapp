// Public OpenAPI document. Cacheable, no auth required.
// Re-exports the schema centralized in lib/openapi.ts.

import { NextResponse } from "next/server"
import { buildOpenApiDocument } from "@/lib/openapi"

export const dynamic = "force-static"

export async function GET() {
  return NextResponse.json(buildOpenApiDocument(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  })
}
