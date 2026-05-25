import type { OrganizationPlan } from "@/types/database"

export interface PlanLimits {
  imageQuota: number
  reportQuota: number
  monthlyCostCapUsd: number
}

export function getPlanDefaults(plan?: OrganizationPlan | string | null): PlanLimits {
  const normalizedPlan = plan ?? "free"

  // Pro: suscripción individual de pago (Lemon Squeezy).
  if (normalizedPlan === "pro") {
    return { imageQuota: 200, reportQuota: 20, monthlyCostCapUsd: 15 }
  }
  // Free: embudo / residentes.
  if (normalizedPlan === "free") {
    return { imageQuota: 15, reportQuota: 2, monthlyCostCapUsd: 1.5 }
  }
  // B2B / admin (congress, academic, admin).
  return { imageQuota: 100, reportQuota: 5, monthlyCostCapUsd: 10 }
}

export function getImageFastPathLimit(
  plan?: OrganizationPlan | string | null,
  monthlyImageQuota?: number | null
) {
  if (typeof monthlyImageQuota === "number" && Number.isFinite(monthlyImageQuota) && monthlyImageQuota > 0) {
    return Math.min(Math.max(Math.floor(monthlyImageQuota), 1), 100)
  }

  return getPlanDefaults(plan).imageQuota
}
