// AI cost guard + rate limit.
// Centralizes quota checks and usage logging across all AI server actions.

import { createClient } from "@/lib/supabase/server"
import { getPlanDefaults } from "@/lib/plan-limits"

export type AiActionType =
  | "image_analysis"
  | "report_generation"
  | "reference_verification"

export interface QuotaCheck {
  allowed: boolean
  reason?: string
  remainingImages?: number
  remainingReports?: number
  monthlyCostUsd?: number
  costCapUsd?: number
}

interface UsageLimits {
  plan: string
  monthly_image_quota: number
  monthly_report_quota: number
  monthly_cost_cap_usd: number
}

const DEFAULT_LIMITS: UsageLimits = {
  plan: "free",
  monthly_image_quota: 15,
  monthly_report_quota: 2,
  monthly_cost_cap_usd: 1.5,
}

function normalizeUsageLimits(limits: UsageLimits): UsageLimits {
  const plan = limits.plan || "free"
  const defaults = getPlanDefaults(plan)
  return {
    plan,
    monthly_image_quota:
      limits.monthly_image_quota > 0
        ? limits.monthly_image_quota
        : defaults.imageQuota,
    monthly_report_quota:
      limits.monthly_report_quota > 0
        ? limits.monthly_report_quota
        : defaults.reportQuota,
    monthly_cost_cap_usd:
      limits.monthly_cost_cap_usd > 0
        ? limits.monthly_cost_cap_usd
        : defaults.monthlyCostCapUsd,
  }
}

// Pricing per 1M tokens, USD (knowledge cutoff Jan 2026). Update if vendors change.
const PRICING = {
  // OpenAI
  "gpt-4o": { input: 5.0, output: 15.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  // Google Gemini
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
  // Anthropic Claude
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-opus-4-7": { input: 15.0, output: 75.0 },
} as const

type PriceableModel = keyof typeof PRICING

function startOfMonthIso(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model as PriceableModel]
  if (!pricing) return 0
  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output
  return Number((inputCost + outputCost).toFixed(5))
}

export async function checkAiQuota(
  userId: string,
  action: AiActionType
): Promise<QuotaCheck> {
  const supabase = await createClient()

  const { data: limitsRow } = await supabase
    .from("ai_usage_limits")
    .select("plan, monthly_image_quota, monthly_report_quota, monthly_cost_cap_usd")
    .eq("user_id", userId)
    .maybeSingle()

  const limits: UsageLimits = normalizeUsageLimits(limitsRow ?? DEFAULT_LIMITS)

  const monthStart = startOfMonthIso()

  const { data: usageRows } = await supabase
    .from("ai_usage")
    .select("action_type, estimated_cost_usd, status")
    .eq("user_id", userId)
    .eq("status", "success")
    .gte("created_at", monthStart)

  const rows = usageRows ?? []
  const usedImages = rows.filter((r) => r.action_type === "image_analysis").length
  const usedReports = rows.filter((r) => r.action_type === "report_generation").length
  const usedCostUsd = rows.reduce(
    (sum, r) => sum + Number(r.estimated_cost_usd ?? 0),
    0
  )

  const remainingImages = Math.max(0, limits.monthly_image_quota - usedImages)
  const remainingReports = Math.max(0, limits.monthly_report_quota - usedReports)

  if (usedCostUsd >= limits.monthly_cost_cap_usd) {
    return {
      allowed: false,
      reason: `Has alcanzado el tope mensual de $${limits.monthly_cost_cap_usd.toFixed(2)} USD en uso de IA. Mejora tu plan o espera al próximo mes.`,
      remainingImages,
      remainingReports,
      monthlyCostUsd: usedCostUsd,
      costCapUsd: limits.monthly_cost_cap_usd,
    }
  }

  if (action === "image_analysis" && remainingImages <= 0) {
    return {
      allowed: false,
      reason: `Has alcanzado tu cuota mensual de ${limits.monthly_image_quota} análisis de imagen (plan ${limits.plan}).`,
      remainingImages,
      remainingReports,
      monthlyCostUsd: usedCostUsd,
      costCapUsd: limits.monthly_cost_cap_usd,
    }
  }

  if (action === "report_generation" && remainingReports <= 0) {
    return {
      allowed: false,
      reason: `Has alcanzado tu cuota mensual de ${limits.monthly_report_quota} reportes generados (plan ${limits.plan}).`,
      remainingImages,
      remainingReports,
      monthlyCostUsd: usedCostUsd,
      costCapUsd: limits.monthly_cost_cap_usd,
    }
  }

  return {
    allowed: true,
    remainingImages,
    remainingReports,
    monthlyCostUsd: usedCostUsd,
    costCapUsd: limits.monthly_cost_cap_usd,
  }
}

export interface RecordUsageInput {
  userId: string
  actionType: AiActionType
  model: string
  inputTokens?: number
  outputTokens?: number
  congressId?: string | null
  imageId?: string | null
  status?: "success" | "blocked" | "error"
  errorMessage?: string | null
}

export async function recordAiUsage(input: RecordUsageInput): Promise<void> {
  const supabase = await createClient()
  const cost =
    input.inputTokens != null && input.outputTokens != null
      ? estimateCost(input.model, input.inputTokens, input.outputTokens)
      : null

  await supabase.from("ai_usage").insert({
    user_id: input.userId,
    action_type: input.actionType,
    model: input.model,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    estimated_cost_usd: cost,
    congress_id: input.congressId ?? null,
    image_id: input.imageId ?? null,
    status: input.status ?? "success",
    error_message: input.errorMessage ?? null,
  })
}
