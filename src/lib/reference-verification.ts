export type VerificationStatus =
  | "verified"
  | "partially_verified"
  | "not_verified"
  | "ambiguous"

export interface ReferenceInput {
  id: string
  raw_text: string
  detected_title: string | null
  detected_authors: string | null
  detected_year: string | null
  detected_journal: string | null
  detected_doi: string | null
}

export interface VerifiedReference {
  status: VerificationStatus
  confidenceScore: number
  matchedTitle: string | null
  matchedAuthors: string | null
  matchedYear: string | null
  matchedJournal: string | null
  matchedDoi: string | null
  source: "openalex"
  notes: string | null
}

interface OpenAlexAuthorship {
  author?: {
    display_name?: string | null
  } | null
}

interface OpenAlexSource {
  display_name?: string | null
}

interface OpenAlexWork {
  id?: string
  title?: string | null
  publication_year?: number | null
  authorships?: OpenAlexAuthorship[] | null
  primary_location?: {
    source?: OpenAlexSource | null
  } | null
  host_venue?: OpenAlexSource | null
  doi?: string | null
}

interface OpenAlexResponse {
  id?: string
  results?: OpenAlexWork[]
}

function cleanText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(value: string) {
  return new Set(cleanText(value).split(" ").filter(Boolean))
}

function similarity(a: string, b: string) {
  const left = tokenize(a)
  const right = tokenize(b)
  if (left.size === 0 || right.size === 0) return 0

  let shared = 0
  for (const token of left) {
    if (right.has(token)) shared++
  }

  return shared / Math.max(left.size, right.size)
}

function extractYear(value: string | null) {
  if (!value) return null
  const match = value.match(/(19|20)\d{2}/)
  return match?.[0] ?? null
}

function formatAuthors(authors: Array<string | null | undefined> | null | undefined) {
  const clean = authors?.filter(Boolean) as string[] | undefined
  if (!clean?.length) return null
  return clean.slice(0, 4).join(", ")
}

function mapOpenAlexStatus(input: {
  exactDoi: boolean
  titleScore: number
  authorScore: number
  yearScore: number
  candidateCount: number
  journalScore: number
}): VerificationStatus {
  const composite =
    input.titleScore * 0.45 +
    input.authorScore * 0.25 +
    input.yearScore * 0.15 +
    input.journalScore * 0.15

  if (input.exactDoi || composite >= 0.82) return "verified"
  if (composite >= 0.55) return "partially_verified"
  if (input.candidateCount > 1 && composite >= 0.35) return "ambiguous"
  return "not_verified"
}

function normalizeDoi(value: string | null | undefined) {
  if (!value) return null
  return cleanText(value.replace(/^https?:\/\/(dx\.)?doi\.org\//i, ""))
}

function normalizeOpenAlexDoi(value: string | null | undefined) {
  if (!value) return null
  return normalizeDoi(value)
}

export async function verifyReferenceWithOpenAlex(
  ref: ReferenceInput
): Promise<VerifiedReference> {
  const detectedTitle = ref.detected_title?.trim() || null
  const detectedYear = extractYear(ref.detected_year)
  const detectedAuthors = ref.detected_authors?.trim() || null
  const detectedJournal = ref.detected_journal?.trim() || null
  const detectedDoi = ref.detected_doi?.trim() || null

  if (!detectedTitle && !detectedDoi) {
    return {
      status: "not_verified",
      confidenceScore: 0,
      matchedTitle: null,
      matchedAuthors: null,
      matchedYear: null,
      matchedJournal: null,
      matchedDoi: null,
      source: "openalex",
      notes: "No se detectó título ni DOI para verificar.",
    }
  }

  const queryUrl = detectedDoi
    ? `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(detectedDoi)}`
    : `https://api.openalex.org/works?search=${encodeURIComponent(detectedTitle ?? "")}&per-page=5`

  const response = await fetch(queryUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MedCongressAI/1.0",
    },
  })

  if (!response.ok) {
    return {
      status: "not_verified",
      confidenceScore: 0,
      matchedTitle: null,
      matchedAuthors: null,
      matchedYear: null,
      matchedJournal: null,
      matchedDoi: null,
      source: "openalex",
      notes: `OpenAlex respondió ${response.status}`,
    }
  }

  const data = (await response.json()) as OpenAlexResponse
  const candidates: OpenAlexWork[] = Array.isArray(data?.results)
    ? data.results
    : data?.id
      ? [data as OpenAlexWork]
      : []

  if (!candidates.length) {
    return {
      status: "not_verified",
      confidenceScore: 0,
      matchedTitle: null,
      matchedAuthors: null,
      matchedYear: null,
      matchedJournal: null,
      matchedDoi: null,
      source: "openalex",
      notes: "No se encontraron coincidencias en OpenAlex.",
    }
  }

  let best: {
    work: OpenAlexWork
    titleScore: number
    authorScore: number
    yearScore: number
    journalScore: number
    score: number
  } | null = null

  for (const work of candidates) {
    const workTitle = work.title ?? ""
    const workYear = work.publication_year?.toString() ?? null
    const workAuthors = work.authorships?.map((a) => a.author?.display_name ?? null) ?? []
    const workJournal = work.primary_location?.source?.display_name ?? work.host_venue?.display_name ?? null
    const workDoi = normalizeOpenAlexDoi(work.doi)

    const titleScore = detectedTitle ? similarity(detectedTitle, workTitle) : 0
    const authorScore = detectedAuthors ? similarity(detectedAuthors, formatAuthors(workAuthors) ?? "") : 0
    const yearScore = detectedYear && workYear ? (detectedYear === workYear ? 1 : 0) : 0
    const journalScore = detectedJournal && workJournal ? similarity(detectedJournal, workJournal) : 0
    const doiMatch = Boolean(detectedDoi && workDoi && normalizeDoi(detectedDoi) === workDoi)
    const score =
      titleScore * 0.45 +
      authorScore * 0.25 +
      yearScore * 0.15 +
      journalScore * 0.15 +
      (doiMatch ? 0.4 : 0)

    if (!best || score > best.score) {
      best = { work, titleScore, authorScore, yearScore, journalScore, score }
    }
  }

  const work = best?.work
  const exactDoi = Boolean(detectedDoi && normalizeDoi(detectedDoi) && normalizeDoi(detectedDoi) === normalizeOpenAlexDoi(work?.doi))
  const status = mapOpenAlexStatus({
    exactDoi,
    titleScore: best?.titleScore ?? 0,
    authorScore: best?.authorScore ?? 0,
    yearScore: best?.yearScore ?? 0,
    candidateCount: candidates.length,
    journalScore: best?.journalScore ?? 0,
  })

  const workAuthors = work?.authorships?.map((a) => a.author?.display_name ?? null) ?? []

  const notes =
    exactDoi
      ? "Coincidencia exacta por DOI."
      : status === "verified"
        ? "Coincidencia sólida por título y metadatos."
        : status === "partially_verified"
          ? "Coincidencia parcial; revisar metadatos manualmente."
          : status === "ambiguous"
            ? "Varias coincidencias posibles."
            : "No se pudo validar con suficiente confianza."

  return {
    status,
    confidenceScore: Math.max(0, Math.min(1, best?.score ?? 0)),
    matchedTitle: work?.title ?? null,
    matchedAuthors: formatAuthors(workAuthors),
    matchedYear: work?.publication_year?.toString() ?? null,
    matchedJournal: work?.primary_location?.source?.display_name ?? work?.host_venue?.display_name ?? null,
    matchedDoi: normalizeOpenAlexDoi(work?.doi),
    source: "openalex",
    notes,
  }
}
