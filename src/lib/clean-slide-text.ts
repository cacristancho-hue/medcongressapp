// Minimal, display-only cleanup of literal slide OCR text.
//
// Goal: show the slide's actual message without the bibliographic noise that is
// already captured structurally as reference_candidates (footer citations, DOIs,
// "References" sections). This is a pure presentation transform — the original
// raw_text is preserved untouched in the database for export/verification.
//
// Conservative by design: it only drops lines that are clearly references, to
// avoid removing clinical content that happens to contain an inline citation.

const REF_HEADING = /^(referencias?|references?|bibliograf[ií]a|citations?)\s*:?\s*$/i

function isStandaloneReference(line: string): boolean {
  const l = line.trim()
  if (!l) return false

  // Whole line is just a DOI / PMID / URL (few tokens).
  if (/^(doi:|pmid:|https?:\/\/)/i.test(l) && l.split(/\s+/).length <= 5) return true
  if (/^doi:\s*10\.\d{4}/i.test(l)) return true

  const hasYear = /\b(19|20)\d{2}\b/.test(l)
  if (!hasYear) return false

  // Strong citation signals that, together with a year, mark a reference entry.
  const hasDoiOrPmid = /\b(doi|pmid)\b/i.test(l)
  const hasEtAl = /\bet al\.?/i.test(l)
  // Journal volume(issue):pages, e.g. "2020;45(3):123-130" or "12(4):e1".
  const hasVolumePages = /\b(19|20)\d{2}\s*[;:]\s*\d+/.test(l) || /\d+\s*\(\s*\d+\s*\)\s*:\s*\d+/.test(l)
  // Numbered bibliography entry: "12. Smith J, ..." or "[3] Smith J, ..."
  const numberedEntry = /^(\(?\d{1,3}[).\]]|\[\d{1,3}\])\s+\p{Lu}/u.test(l)

  // Reference if it carries hard biblio markers, or looks like a numbered entry
  // with a year and punctuation typical of a citation.
  if (hasDoiOrPmid) return true
  if (hasVolumePages && (hasEtAl || numberedEntry || /[.;]/.test(l))) return true
  if (numberedEntry && hasEtAl) return true

  return false
}

export function cleanSlideText(input: string | null | undefined): string {
  if (!input) return ""

  const lines = input.split(/\r?\n/)
  const kept: string[] = []
  let inRefsSection = false

  for (const raw of lines) {
    const line = raw.trim()

    if (REF_HEADING.test(line)) {
      // Everything after a "References" heading is bibliography → drop the rest.
      inRefsSection = true
      continue
    }
    if (inRefsSection) continue
    if (!line) {
      kept.push("")
      continue
    }
    if (isStandaloneReference(line)) continue

    kept.push(raw)
  }

  // Collapse runs of blank lines and trim.
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}
