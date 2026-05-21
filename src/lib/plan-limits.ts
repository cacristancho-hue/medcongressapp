import type { OrganizationPlan } from "@/types/database"

export interface PlanLimits {
  imageQuota: number
  reportQuota: number
  monthlyCostCapUsd: number
}

export function getPlanDefaults(plan?: OrganizationPlan | string | null): PlanLimits {
  const normalizedPlan = plan ?? "free"
  const isFree = normalizedPlan === "free"

  return {
    imageQuota: isFree ? 15 : 100,
    reportQuota: isFree ? 2 : 5,
    monthlyCostCapUsd: isFree ? 1.5 : 10,
  }
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
