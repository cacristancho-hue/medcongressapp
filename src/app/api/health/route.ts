// /api/health — uptime probe.
// Returns 200 with a small JSON snapshot of dependent services.
// Optional Bearer auth via HEALTH_CHECK_SECRET; without it, public 200/503.

import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, "ok" | "fail" | "skipped"> = {
    env: "ok",
    db: "skipped",
    ai_flag: process.env.MEDCONGRESS_AI_ENABLED === "true" ? "ok" : "skipped",
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    checks.env = "fail"
  }

  // DB ping (only if service-role key is present — otherwise skip).
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient()
      const { error } = await supabase.from("organizations").select("id", { count: "exact", head: true }).limit(1)
      checks.db = error ? "fail" : "ok"
    } catch {
      checks.db = "fail"
    }
  }

  const allOk = Object.values(checks).every((v) => v !== "fail")
  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  )
}
