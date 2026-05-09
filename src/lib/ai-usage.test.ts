import { describe, it, expect } from "vitest"
import { estimateCost } from "./ai-usage"

describe("estimateCost", () => {
  it("returns 0 for unknown models", () => {
    expect(estimateCost("unknown-model", 1000, 500)).toBe(0)
  })

  it("computes USD for gpt-4o", () => {
    // 1M input × $5 + 1M output × $15 = $20
    expect(estimateCost("gpt-4o", 1_000_000, 1_000_000)).toBeCloseTo(20, 4)
  })

  it("computes USD for gemini-2.5-flash", () => {
    // 1M input × $0.30 + 1M output × $2.50 = $2.80
    expect(estimateCost("gemini-2.5-flash", 1_000_000, 1_000_000)).toBeCloseTo(
      2.8,
      4
    )
  })

  it("computes USD for claude-sonnet-4-6", () => {
    // 1M input × $3 + 1M output × $15 = $18
    expect(estimateCost("claude-sonnet-4-6", 1_000_000, 1_000_000)).toBeCloseTo(
      18,
      4
    )
  })
})
