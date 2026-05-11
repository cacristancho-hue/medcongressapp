// Multi-source bibliographic reference verification.
// Sources: CrossRef (DOI authority + Retraction Watch via update-to),
//          PubMed E-utils (biomedical gold standard, returns PMID),
//          OpenAlex (broad coverage fallback).
// Order: prefer the most authoritative match available; aggregate the rest.

export type VerificationStatus =
  | "verified"
  | "partially_verified"
  | "not_verified"
  | "ambiguous"
  | "retracted"

export type VerificationSource = "crossref" | "pubmed" | "openalex" | "none"

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
  matchedPmid: string | null
  source: VerificationSource
  sourcesChecked: VerificationSource[]
  retracted: boolean
  notes: string
  abstract?: string | null
  publicationType?: string | null
  meshTerms?: string[]
}

interface ExternalCandidate {
  source: VerificationSource
  title: string | null
  authors: string | null
  year: string | null
  journal: string | null
  doi: string | null
  pmid: string | null
  retracted: boolean
  retractionNotice: string | null
  abstract?: string | null
  publicationType?: string | null
  meshTerms?: string[]
}

const POLITE_USER_AGENT =
  "MedCongressAI/1.0 (https://github.com/cacristancho-hue/medcongressapp; mailto:cacristanchoo@gmail.com)"

const FETCH_TIMEOUT_MS = 8000

function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  return fetch(url, {
    ...init,
    signal: controller.signal,
    headers: {
      Accept: "application/json",
      "User-Agent": POLITE_USER_AGENT,
      ...(init.headers ?? {}),
    },
  }).finally(() => clearTimeout(timer))
}

function cleanText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(value: string): Set<string> {
  return new Set(cleanText(value).split(" ").filter(Boolean))
}

function similarity(a: string | null, b: string | null): number {
  if (!a || !b) return 0
  const left = tokenize(a)
  const right = tokenize(b)
  if (left.size === 0 || right.size === 0) return 0
  let shared = 0
  for (const token of left) if (right.has(token)) shared++
  return shared / Math.max(left.size, right.size)
}

function extractYear(value: string | null): string | null {
  if (!value) return null
  return value.match(/(19|20)\d{2}/)?.[0] ?? null
}

function normalizeDoi(value: string | null | undefined): string | null {
  if (!value) return null
  return value
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .trim()
    .toLowerCase()
}

function joinAuthors(parts: Array<string | null | undefined>): string | null {
  const cleaned = parts.filter((x): x is string => Boolean(x && x.trim()))
  if (cleaned.length === 0) return null
  return cleaned.slice(0, 4).join(", ")
}

// ============================================================
// CrossRef
// Docs: https://api.crossref.org/swagger-ui/index.html
// Retractions surface via "update-to" with update_type === "retraction".
// ============================================================

interface CrossRefMessage {
  DOI?: string
  title?: string[]
  author?: Array<{ given?: string; family?: string }>
  issued?: { "date-parts"?: number[][] }
  "container-title"?: string[]
  "update-to"?: Array<{ DOI?: string; type?: string; updated?: { "date-parts"?: number[][] } }>
  relation?: Record<string, Array<{ id?: string; "id-type"?: string }>>
}

interface CrossRefSingleResponse {
  message?: CrossRefMessage
}

interface CrossRefSearchResponse {
  message?: { items?: CrossRefMessage[] }
}

function crossrefMessageToCandidate(msg: CrossRefMessage): ExternalCandidate {
  const title = msg.title?.[0] ?? null
  const year = msg.issued?.["date-parts"]?.[0]?.[0]?.toString() ?? null
  const journal = msg["container-title"]?.[0] ?? null
  const authors = joinAuthors(
    (msg.author ?? []).map((a) => [a.given, a.family].filter(Boolean).join(" "))
  )
  const doi = normalizeDoi(msg.DOI)

  const retractionUpdate = msg["update-to"]?.find(
    (u) => (u.type ?? "").toLowerCase() === "retraction"
  )
  const retracted = Boolean(retractionUpdate)
  const retractionNotice = retracted
    ? `CrossRef update-to retraction (DOI ${retractionUpdate?.DOI ?? "unknown"})`
    : null

  // PMID via relation block (rare but possible).
  const relationPmid = msg.relation
    ? Object.values(msg.relation)
        .flat()
        .find((r) => (r["id-type"] ?? "").toLowerCase() === "pmid")?.id ?? null
    : null

  return {
    source: "crossref",
    title,
    authors,
    year,
    journal,
    doi,
    pmid: relationPmid,
    retracted,
    retractionNotice,
  }
}

async function queryCrossRefByDoi(doi: string): Promise<ExternalCandidate | null> {
  try {
    const response = await fetchWithTimeout(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}`
    )
    if (!response.ok) return null
    const data = (await response.json()) as CrossRefSingleResponse
    if (!data.message) return null
    return crossrefMessageToCandidate(data.message)
  } catch {
    return null
  }
}

async function queryCrossRefByTitle(
  title: string,
  year: string | null
): Promise<ExternalCandidate[]> {
  try {
    const params = new URLSearchParams({
      "query.bibliographic": title,
      rows: "5",
    })
    if (year) {
      params.set("filter", `from-pub-date:${year},until-pub-date:${year}`)
    }
    const response = await fetchWithTimeout(
      `https://api.crossref.org/works?${params.toString()}`
    )
    if (!response.ok) return []
    const data = (await response.json()) as CrossRefSearchResponse
    return (data.message?.items ?? []).map(crossrefMessageToCandidate)
  } catch {
    return []
  }
}

// ============================================================
// PubMed E-utils
// Docs: https://www.ncbi.nlm.nih.gov/books/NBK25501/
// Two-step: esearch (PMID) → esummary (metadata).
// ============================================================

interface PubMedSearchResponse {
  esearchresult?: { idlist?: string[] }
}

interface PubMedSummaryAuthor {
  name?: string
  authtype?: string
}

interface PubMedSummaryItem {
  uid?: string
  title?: string
  authors?: PubMedSummaryAuthor[]
  source?: string
  pubdate?: string
  elocationid?: string
  articleids?: Array<{ idtype?: string; value?: string }>
  pubtype?: string[]
}

interface PubMedSummaryResponse {
  result?: Record<string, PubMedSummaryItem | string[]>
}

function pubmedItemToCandidate(item: PubMedSummaryItem): ExternalCandidate {
  const pmid = item.uid ?? null
  const title = item.title?.replace(/\.$/, "") ?? null
  const year = extractYear(item.pubdate ?? null)
  const journal = item.source ?? null
  const authors = joinAuthors((item.authors ?? []).map((a) => a.name))
  const doi =
    normalizeDoi(
      item.articleids?.find((id) => (id.idtype ?? "").toLowerCase() === "doi")?.value
    ) ?? null

  const retracted = (item.pubtype ?? []).some((t) =>
    /retract/i.test(t)
  )

  return {
    source: "pubmed",
    title,
    authors,
    year,
    journal,
    doi,
    pmid,
    retracted,
    retractionNotice: retracted ? "PubMed pubtype includes retraction" : null,
  }
}

async function queryPubMedByTitle(
  title: string,
  year: string | null
): Promise<ExternalCandidate | null> {
  try {
    const term = year ? `${title} AND ${year}[dp]` : title
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&term=${encodeURIComponent(term)}`
    const searchRes = await fetchWithTimeout(searchUrl)
    if (!searchRes.ok) return null
    const searchData = (await searchRes.json()) as PubMedSearchResponse
    const ids = searchData.esearchresult?.idlist ?? []
    if (ids.length === 0) return null

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`
    const summaryRes = await fetchWithTimeout(summaryUrl)
    if (!summaryRes.ok) return null
    const summaryData = (await summaryRes.json()) as PubMedSummaryResponse

    let bestCandidate: ExternalCandidate | null = null
    let bestScore = 0
    for (const id of ids) {
      const raw = summaryData.result?.[id]
      if (!raw || Array.isArray(raw)) continue
      const candidate = pubmedItemToCandidate(raw)
      const score = similarity(title, candidate.title)
      if (score > bestScore) {
        bestScore = score
        bestCandidate = candidate
      }
    }
    return bestCandidate
  } catch {
    return null
  }
}

async function queryPubMedByPmid(pmid: string): Promise<ExternalCandidate | null> {
  try {
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${encodeURIComponent(pmid)}`
    const res = await fetchWithTimeout(summaryUrl)
    if (!res.ok) return null
    const data = (await res.json()) as PubMedSummaryResponse
    const raw = data.result?.[pmid]
    if (!raw || Array.isArray(raw)) return null
    return pubmedItemToCandidate(raw)
  } catch {
    return null
  }
}

// ============================================================
// OpenAlex
// Docs: https://docs.openalex.org/
// ============================================================

interface OpenAlexAuthorship {
  author?: { display_name?: string | null } | null
}

interface OpenAlexWork {
  id?: string
  title?: string | null
  publication_year?: number | null
  authorships?: OpenAlexAuthorship[] | null
  primary_location?: { source?: { display_name?: string | null } | null } | null
  host_venue?: { display_name?: string | null } | null
  doi?: string | null
  ids?: { pmid?: string | null }
  is_retracted?: boolean | null
}

interface OpenAlexResponse {
  id?: string
  results?: OpenAlexWork[]
}

function openAlexWorkToCandidate(work: OpenAlexWork): ExternalCandidate {
  const journal =
    work.primary_location?.source?.display_name ?? work.host_venue?.display_name ?? null
  const authors = joinAuthors(
    (work.authorships ?? []).map((a) => a.author?.display_name ?? null)
  )
  const pmidRaw = work.ids?.pmid ?? null
  const pmid = pmidRaw ? pmidRaw.replace(/^https?:\/\/.*\/(\d+)$/, "$1") : null

  // Reconstruct abstract from inverted index (OpenAlex style)
  let abstract: string | null = null
  const index = (work as any).abstract_inverted_index as Record<string, number[]> | undefined
  if (index) {
    try {
      const words: string[] = []
      let maxPos = 0
      for (const positions of Object.values(index)) {
        for (const pos of positions) if (pos > maxPos) maxPos = pos
      }
      for (const [word, positions] of Object.entries(index)) {
        for (const pos of positions) words[pos] = word
      }
      abstract = words.join(" ").trim()
    } catch (e) {
      console.warn("[openalex] failed to reconstruct abstract:", e)
    }
  }

  return {
    source: "openalex",
    title: work.title ?? null,
    authors,
    year: work.publication_year?.toString() ?? null,
    journal,
    doi: normalizeDoi(work.doi),
    pmid,
    retracted: Boolean(work.is_retracted),
    retractionNotice: work.is_retracted ? "OpenAlex is_retracted=true" : null,
    abstract,
    publicationType: (work as any).type ?? null,
    meshTerms: (work as any).concepts?.filter((c: any) => c.level <= 1).map((c: any) => c.display_name) ?? []
  }
}

async function queryOpenAlex(
  title: string | null,
  doi: string | null
): Promise<ExternalCandidate[]> {
  try {
    const url = doi
      ? `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`
      : title
        ? `https://api.openalex.org/works?search=${encodeURIComponent(title)}&per-page=5`
        : null
    if (!url) return []
    const response = await fetchWithTimeout(url)
    if (!response.ok) return []
    const data = (await response.json()) as OpenAlexResponse
    const works: OpenAlexWork[] = Array.isArray(data?.results)
      ? data.results
      : data?.id
        ? [data as OpenAlexWork]
        : []
    return works.map(openAlexWorkToCandidate)
  } catch {
    return []
  }
}

// ============================================================
// Scoring & status mapping
// ============================================================

function scoreCandidate(input: ReferenceInput, candidate: ExternalCandidate): {
  score: number
  titleScore: number
  authorScore: number
  yearScore: number
  journalScore: number
  doiMatch: boolean
  pmidMatch: boolean
} {
  const detectedYear = extractYear(input.detected_year)
  const detectedDoi = normalizeDoi(input.detected_doi)

  const titleScore = similarity(input.detected_title, candidate.title)
  const authorScore = similarity(input.detected_authors, candidate.authors)
  const journalScore = similarity(input.detected_journal, candidate.journal)
  const yearScore =
    detectedYear && candidate.year ? (detectedYear === candidate.year ? 1 : 0) : 0
  const doiMatch = Boolean(detectedDoi && candidate.doi && detectedDoi === candidate.doi)
  // PMID is exact-match only — heuristic against the raw text.
  const pmidMatch = Boolean(
    candidate.pmid && input.raw_text && input.raw_text.includes(candidate.pmid)
  )

  const composite =
    titleScore * 0.45 +
    authorScore * 0.25 +
    yearScore * 0.15 +
    journalScore * 0.15 +
    (doiMatch ? 0.4 : 0) +
    (pmidMatch ? 0.2 : 0)

  return {
    score: Math.min(1, composite),
    titleScore,
    authorScore,
    yearScore,
    journalScore,
    doiMatch,
    pmidMatch,
  }
}

function mapStatus(input: {
  doiMatch: boolean
  pmidMatch: boolean
  titleScore: number
  authorScore: number
  yearScore: number
  journalScore: number
  candidateCount: number
  retracted: boolean
}): VerificationStatus {
  if (input.retracted) return "retracted"

  const composite =
    input.titleScore * 0.45 +
    input.authorScore * 0.25 +
    input.yearScore * 0.15 +
    input.journalScore * 0.15

  // RIGOR MÉDICO: Solo verificamos automáticamente si hay match de ID fuerte
  // o si la similitud textual es extremadamente alta (>85%).
  if (input.doiMatch || input.pmidMatch || composite >= 0.85) return "verified"
  
  // Si la similitud es media, lo marcamos como ambiguo para pedir confirmación humana
  if (composite >= 0.50) return "ambiguous"
  
  return "not_verified"
}

// ============================================================
// Public API
// ============================================================

export async function verifyReference(input: ReferenceInput): Promise<VerifiedReference> {
  const detectedTitle = input.detected_title?.trim() || null
  const detectedDoi = normalizeDoi(input.detected_doi)
  const detectedYear = extractYear(input.detected_year)
  const sourcesChecked: VerificationSource[] = []

  if (!detectedTitle && !detectedDoi) {
    return {
      status: "not_verified",
      confidenceScore: 0,
      matchedTitle: null,
      matchedAuthors: null,
      matchedYear: null,
      matchedJournal: null,
      matchedDoi: null,
      matchedPmid: null,
      source: "none",
      sourcesChecked,
      retracted: false,
      notes: "Sin título ni DOI detectado; imposible verificar.",
    }
  }

  const candidates: ExternalCandidate[] = []

  // 1. CrossRef — most authoritative, also surfaces retractions via update-to.
  if (detectedDoi) {
    sourcesChecked.push("crossref")
    const cr = await queryCrossRefByDoi(detectedDoi)
    if (cr) candidates.push(cr)
  } else if (detectedTitle) {
    sourcesChecked.push("crossref")
    const crList = await queryCrossRefByTitle(detectedTitle, detectedYear)
    candidates.push(...crList)
  }

  // 2. PubMed — biomedical gold standard. Also flags retractions via pubtype.
  if (detectedTitle) {
    sourcesChecked.push("pubmed")
    const pm = await queryPubMedByTitle(detectedTitle, detectedYear)
    if (pm) candidates.push(pm)
  }

  // 3. OpenAlex — broad coverage fallback.
  sourcesChecked.push("openalex")
  const oa = await queryOpenAlex(detectedTitle, detectedDoi)
  candidates.push(...oa)

  if (candidates.length === 0) {
    return {
      status: "not_verified",
      confidenceScore: 0,
      matchedTitle: null,
      matchedAuthors: null,
      matchedYear: null,
      matchedJournal: null,
      matchedDoi: null,
      matchedPmid: null,
      source: "none",
      sourcesChecked,
      retracted: false,
      notes: "Ninguna fuente devolvió coincidencias.",
    }
  }

  let best: { candidate: ExternalCandidate; score: ReturnType<typeof scoreCandidate> } | null = null
  for (const candidate of candidates) {
    const score = scoreCandidate(input, candidate)
    if (!best || score.score > best.score.score) {
      best = { candidate, score }
    }
  }

  // Aggregate retraction signals across all sources, even if best didn't flag it.
  const retractionFromAny = candidates.some((c) => c.retracted)
  const retractionNotices = candidates
    .filter((c) => c.retracted && c.retractionNotice)
    .map((c) => `${c.source}: ${c.retractionNotice}`)
    .join(" | ")

  const retracted = best?.candidate.retracted || retractionFromAny

  const status = mapStatus({
    doiMatch: best?.score.doiMatch ?? false,
    pmidMatch: best?.score.pmidMatch ?? false,
    titleScore: best?.score.titleScore ?? 0,
    authorScore: best?.score.authorScore ?? 0,
    yearScore: best?.score.yearScore ?? 0,
    journalScore: best?.score.journalScore ?? 0,
    candidateCount: candidates.length,
    retracted,
  })

  // PMID enrichment: if best lacks PMID, try to fetch it from PubMed by DOI.
  let matchedPmid = best?.candidate.pmid ?? null
  if (!matchedPmid && best?.candidate.doi) {
    const pmByDoi = await queryPubMedByTitle(best.candidate.title ?? "", best.candidate.year)
    if (pmByDoi?.doi === best.candidate.doi && pmByDoi.pmid) {
      matchedPmid = pmByDoi.pmid
    }
  }

  const notes =
    status === "retracted"
      ? `Retractado. ${retractionNotices || "Detectado por una de las fuentes consultadas."}`
      : status === "verified"
        ? best?.score.doiMatch
          ? `Coincidencia exacta por DOI (${best.candidate.source}).`
          : best?.score.pmidMatch
            ? `Coincidencia exacta por PMID (${best.candidate.source}).`
            : `Coincidencia sólida por título y metadatos (${best?.candidate.source}).`
        : status === "partially_verified"
          ? "Coincidencia parcial; revisar metadatos manualmente."
          : status === "ambiguous"
            ? `Múltiples candidatos plausibles (${candidates.length}).`
            : "No se pudo validar con suficiente confianza."

  return {
    status,
    confidenceScore: best?.score.score ?? 0,
    matchedTitle: best?.candidate.title ?? null,
    matchedAuthors: best?.candidate.authors ?? null,
    matchedYear: best?.candidate.year ?? null,
    matchedJournal: best?.candidate.journal ?? null,
    matchedDoi: best?.candidate.doi ?? null,
    matchedPmid,
    source: best?.candidate.source ?? "none",
    sourcesChecked,
    retracted,
    notes,
    abstract: best?.candidate.abstract,
    publicationType: best?.candidate.publicationType,
    meshTerms: best?.candidate.meshTerms,
  }
}

// Backward-compatible alias for existing callers.
export const verifyReferenceWithOpenAlex = verifyReference

// PMID by-id helper (used when caller already has a PMID string).
export { queryPubMedByPmid }
