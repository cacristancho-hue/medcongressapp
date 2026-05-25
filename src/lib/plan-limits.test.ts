import { describe, it, expect } from "vitest"
import { getPlanDefaults, getImageFastPathLimit } from "./plan-limits"

describe("getPlanDefaults", () => {
  it("free: 15 imágenes / 2 reportes / $1.50", () => {
    expect(getPlanDefaults("free")).toEqual({
      imageQuota: 15,
      reportQuota: 2,
      monthlyCostCapUsd: 1.5,
    })
  })

  it("pro: 200 imágenes / 20 reportes / $15", () => {
    expect(getPlanDefaults("pro")).toEqual({
      imageQuota: 200,
      reportQuota: 20,
      monthlyCostCapUsd: 15,
    })
  })

  it("b2b (congress/academic/admin): 100 / 5 / $10", () => {
    for (const plan of ["congress", "academic", "admin"]) {
      expect(getPlanDefaults(plan)).toEqual({
        imageQuota: 100,
        reportQuota: 5,
        monthlyCostCapUsd: 10,
      })
    }
  })

  it("null/undefined caen a free", () => {
    expect(getPlanDefaults(null)).toEqual(getPlanDefaults("free"))
    expect(getPlanDefaults(undefined)).toEqual(getPlanDefaults("free"))
  })
})

describe("getImageFastPathLimit", () => {
  it("usa la cuota explícita cuando es válida (cap 100)", () => {
    expect(getImageFastPathLimit("pro", 50)).toBe(50)
    expect(getImageFastPathLimit("pro", 9999)).toBe(100) // cap
  })

  it("cae al default del plan si no hay cuota válida", () => {
    expect(getImageFastPathLimit("free", 0)).toBe(15)
    expect(getImageFastPathLimit("free", null)).toBe(15)
  })
})
