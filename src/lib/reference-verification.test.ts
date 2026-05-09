// Smoke test for the multi-source verification pipeline.
// Mocks fetch so we never hit live CrossRef/PubMed/OpenAlex during CI.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { verifyReference } from "./reference-verification"

const originalFetch = globalThis.fetch

describe("verifyReference", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it("returns not_verified when no title and no DOI are provided", async () => {
    const result = await verifyReference({
      id: "x",
      raw_text: "",
      detected_title: null,
      detected_authors: null,
      detected_year: null,
      detected_journal: null,
      detected_doi: null,
    })

    expect(result.status).toBe("not_verified")
    expect(result.confidenceScore).toBe(0)
    expect(result.source).toBe("none")
  })

  it("flags a CrossRef hit with update-to retraction as 'retracted'", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("api.crossref.org/works/10.0001%2Ffake")) {
        return new Response(
          JSON.stringify({
            message: {
              DOI: "10.0001/fake",
              title: ["Retracted: Example study on bilastine"],
              author: [{ given: "Jane", family: "Doe" }],
              issued: { "date-parts": [[2023]] },
              "container-title": ["Lancet"],
              "update-to": [
                { DOI: "10.0001/fake-retraction", type: "retraction" },
              ],
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      }
      return new Response("{}", { status: 404 })
    })

    const result = await verifyReference({
      id: "y",
      raw_text: "Doe et al. Lancet 2023",
      detected_title: "Example study on bilastine",
      detected_authors: "Jane Doe",
      detected_year: "2023",
      detected_journal: "Lancet",
      detected_doi: "10.0001/fake",
    })

    expect(result.retracted).toBe(true)
    expect(result.status).toBe("retracted")
    expect(result.sourcesChecked).toContain("crossref")
  })
})
