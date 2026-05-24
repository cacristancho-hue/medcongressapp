"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { clsx } from "clsx"
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  Filter,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { useTranslations } from "next-intl"
import { LibraryReference } from "@/lib/actions/library"
import { softDeleteReference, updateReferenceCandidate, verifySingleReference } from "@/lib/actions/references"
import { createClient } from "@/lib/supabase/client"

interface Props {
  initialReferences: LibraryReference[]
}

interface ReferenceEditorDraft {
  official_title: string
  official_authors: string
  official_year: string
  official_journal: string
  detected_doi: string
  detected_pmid: string
  publication_type: string
  verification_status: string
  verification_notes: string
  clinical_tags: string
}

function createDraft(reference: LibraryReference): ReferenceEditorDraft {
  return {
    official_title: reference.official_title ?? "",
    official_authors: reference.official_authors ?? "",
    official_year: reference.official_year ?? "",
    official_journal: reference.official_journal ?? "",
    detected_doi: reference.detected_doi ?? "",
    detected_pmid: reference.detected_pmid ?? "",
    publication_type: reference.publication_type ?? "",
    verification_status: reference.verification_status ?? "not_verified",
    verification_notes: reference.verification_notes ?? "",
    clinical_tags: (reference.clinical_tags ?? []).join(", "),
  }
}

// Parse a comma/semicolon-separated tag string into a clean array.
function parseTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    )
  )
}

export default function ReferenceLibrary({ initialReferences }: Props) {
  const router = useRouter()
  const t = useTranslations("library")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCongress, setFilterCongress] = useState<string>("all")
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterYear, setFilterYear] = useState<string>("all")
  const [filterTag, setFilterTag] = useState<string>("all")
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "congress">("grid")
  const [selectedReference, setSelectedReference] = useState<LibraryReference | null>(null)
  const [draft, setDraft] = useState<ReferenceEditorDraft | null>(null)
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null)
  const [isSavingDetail, setIsSavingDetail] = useState(false)

  // Reset the editable draft when the selected reference changes. Done during
  // render (React's recommended pattern over a setState-in-effect) so the draft
  // is in sync on the same commit, avoiding a cascading re-render.
  const selectedId = selectedReference?.id ?? null
  if (selectedId !== prevSelectedId) {
    setPrevSelectedId(selectedId)
    setDraft(selectedReference ? createDraft(selectedReference) : null)
  }
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("reference_candidates_biblioteca")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reference_candidates" },
        () => {
          if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
          refreshTimerRef.current = setTimeout(() => {
            router.refresh()
          }, 250)
        }
      )
      .subscribe()

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      supabase.removeChannel(channel)
    }
  }, [router])

  const congresses = useMemo(() => {
    const names = new Set(initialReferences.map((r) => r.congress_name.split(", ")).flat())
    return Array.from(names).sort()
  }, [initialReferences])

  const specialties = useMemo(() => {
    const names = new Set(initialReferences.map((r) => r.specialty).filter(Boolean))
    return Array.from(names).sort()
  }, [initialReferences])

  const years = useMemo(() => {
    const ys = new Set(
      initialReferences
        .map((r) => r.detected_year)
        .filter((y): y is string => Boolean(y && /^\d{4}$/.test(y)))
    )
    return Array.from(ys).sort().reverse()
  }, [initialReferences])

  const counts = useMemo(() => {
    const c = { verified: 0, partially_verified: 0, ambiguous: 0, not_verified: 0, retracted: 0 }
    for (const r of initialReferences) {
      const s = r.verification_status as keyof typeof c
      if (s in c) c[s]++
    }
    return c
  }, [initialReferences])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    initialReferences.forEach((r) => (r.clinical_tags ?? []).forEach((t) => set.add(t)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [initialReferences])

  const favoritesCount = useMemo(
    () => initialReferences.filter((r) => r.is_favorite).length,
    [initialReferences]
  )

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return initialReferences.filter((ref) => {
      const matchesSearch =
        !term ||
        ref.detected_title?.toLowerCase().includes(term) ||
        ref.detected_authors?.toLowerCase().includes(term) ||
        ref.raw_text.toLowerCase().includes(term) ||
        ref.detected_journal?.toLowerCase().includes(term) ||
        ref.verification_notes?.toLowerCase().includes(term) ||
        (ref.clinical_tags ?? []).some((t) => t.toLowerCase().includes(term))

      const matchesCongress = filterCongress === "all" || ref.congress_name.includes(filterCongress)
      const matchesSpecialty = filterSpecialty === "all" || ref.specialty === filterSpecialty
      const matchesStatus = filterStatus === "all" || ref.verification_status === filterStatus
      const matchesYear = filterYear === "all" || ref.detected_year === filterYear
      const matchesTag = filterTag === "all" || (ref.clinical_tags ?? []).includes(filterTag)
      const matchesFavorite = !onlyFavorites || ref.is_favorite

      return matchesSearch && matchesCongress && matchesSpecialty && matchesStatus && matchesYear && matchesTag && matchesFavorite
    })
  }, [initialReferences, searchTerm, filterCongress, filterSpecialty, filterStatus, filterYear, filterTag, onlyFavorites])

  const groupedByCongress = useMemo(() => {
    const groups: Record<string, LibraryReference[]> = {}
    filtered.forEach((ref) => {
      ref.congress_name.split(", ").forEach((name) => {
        if (!groups[name]) groups[name] = []
        groups[name].push(ref)
      })
    })
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  const closeReferenceDetail = () => {
    setSelectedReference(null)
    setDraft(null)
  }

  const saveReferenceDetail = async () => {
    if (!selectedReference || !draft) return

    setIsSavingDetail(true)
    try {
      const tags = parseTags(draft.clinical_tags)
      const res = await updateReferenceCandidate({
        id: selectedReference.id,
        congressId: selectedReference.congress_id,
        updates: {
          official_title: draft.official_title.trim() || null,
          official_authors: draft.official_authors.trim() || null,
          official_year: draft.official_year.trim() || null,
          official_journal: draft.official_journal.trim() || null,
          detected_doi: draft.detected_doi.trim() || null,
          detected_pmid: draft.detected_pmid.trim() || null,
          publication_type: draft.publication_type.trim() || null,
          verification_status: draft.verification_status,
          verification_notes: draft.verification_notes.trim() || null,
          clinical_tags: tags.length > 0 ? tags : null,
        },
      })

      if (res.success) {
        toast.success(t("refUpdated"))
        setSelectedReference((prev) =>
          prev
            ? {
                ...prev,
                official_title: draft.official_title.trim() || null,
                official_authors: draft.official_authors.trim() || null,
                official_year: draft.official_year.trim() || null,
                official_journal: draft.official_journal.trim() || null,
                detected_doi: draft.detected_doi.trim() || null,
                detected_pmid: draft.detected_pmid.trim() || null,
                publication_type: draft.publication_type.trim() || null,
                verification_status: draft.verification_status,
                verification_notes: draft.verification_notes.trim() || null,
                clinical_tags: tags.length > 0 ? tags : null,
              }
            : prev
        )
        router.refresh()
      }
    } catch (error) {
      console.error(error)
      toast.error(t("refSaveError"))
    } finally {
      setIsSavingDetail(false)
    }
  }

  const toggleFavorite = async (reference: LibraryReference) => {
    const next = !reference.is_favorite
    // Optimistic update of the open detail panel.
    setSelectedReference((prev) =>
      prev && prev.id === reference.id ? { ...prev, is_favorite: next } : prev
    )
    const res = await updateReferenceCandidate({
      id: reference.id,
      congressId: reference.congress_id,
      updates: { is_favorite: next },
    })
    if (res.success) {
      toast.success(next ? t("addedFavorite") : t("removedFavorite"))
      router.refresh()
    } else {
      toast.error(res.error)
      setSelectedReference((prev) =>
        prev && prev.id === reference.id ? { ...prev, is_favorite: !next } : prev
      )
    }
  }

  const verifySelected = async () => {
    if (!selectedReference) return
    const result = await verifySingleReference({
      referenceId: selectedReference.id,
      congressId: selectedReference.congress_id,
    })
    if (!result.success) {
      toast.error(result.error || t("verifyRefError"))
      return
    }
    toast.success(t("reVerified"))
    setSelectedReference((prev) =>
      prev ? { ...prev, verification_status: result.data.status } : prev
    )
    setDraft((prev) => (prev ? { ...prev, verification_status: result.data.status } : prev))
    router.refresh()
  }

  const confirmSelected = async () => {
    if (!selectedReference) return
    const res = await updateReferenceCandidate({
      id: selectedReference.id,
      congressId: selectedReference.congress_id,
      updates: { verification_status: "verified" },
    })
    if (res.success) {
      toast.success(t("refConfirmed"))
      setSelectedReference((prev) => (prev ? { ...prev, verification_status: "verified" } : prev))
      setDraft((prev) => (prev ? { ...prev, verification_status: "verified" } : prev))
      router.refresh()
    }
  }

  const deleteSelected = async () => {
    if (!selectedReference) return
    const ok = confirm(t("deleteConfirm"))
    if (!ok) return
    const res = await softDeleteReference({
      id: selectedReference.id,
      congressId: selectedReference.congress_id,
    })
    if (res.success) {
      toast.success(t("refDeleted"))
      closeReferenceDetail()
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
              <button
                onClick={() => setViewMode("grid")}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  viewMode === "grid"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t("viewGeneral")}
              </button>
              <button
                onClick={() => setViewMode("congress")}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  viewMode === "congress"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t("viewByCongress")}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                className="text-xs border-slate-200 rounded-lg bg-slate-50 py-1.5 pl-2 pr-8"
                value={filterCongress}
                onChange={(e) => setFilterCongress(e.target.value)}
              >
                <option value="all">{t("allCongresses")}</option>
                {congresses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <select
              className="text-xs border-slate-200 rounded-lg bg-slate-50 py-1.5 pl-2 pr-8"
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
            >
              <option value="all">{t("allSpecialties")}</option>
              {specialties.map((s) => (
                <option key={s!} value={s!}>
                  {s}
                </option>
              ))}
            </select>

            <select
              className="text-xs border-slate-200 rounded-lg bg-slate-50 py-1.5 pl-2 pr-8"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t("anyStatus")}</option>
              <option value="verified">{t("statusVerified")} ({counts.verified})</option>
              <option value="partially_verified">{t("statusPartial")} ({counts.partially_verified})</option>
              <option value="ambiguous">{t("statusAmbiguous")} ({counts.ambiguous})</option>
              <option value="not_verified">{t("statusNotVerified")} ({counts.not_verified})</option>
              <option value="retracted">{t("statusRetracted")} ({counts.retracted})</option>
            </select>

            <select
              className="text-xs border-slate-200 rounded-lg bg-slate-50 py-1.5 pl-2 pr-8"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">{t("anyYear")}</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {allTags.length > 0 && (
              <select
                className="text-xs border-slate-200 rounded-lg bg-slate-50 py-1.5 pl-2 pr-8"
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                title={t("filterByTag")}
              >
                <option value="all">{t("allTags")}</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setOnlyFavorites((v) => !v)}
              className={clsx(
                "text-xs rounded-lg py-1.5 px-3 border font-semibold transition-colors",
                onlyFavorites
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:border-amber-200"
              )}
              title={t("onlyFavoritesTitle")}
            >
              ★ {t("favorites")}{favoritesCount > 0 ? ` (${favoritesCount})` : ""}
            </button>
          </div>
        </div>

        <div className="flex items-baseline justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>
            {t("results", { shown: filtered.length, total: initialReferences.length })}
          </span>
          {(filterCongress !== "all" ||
            filterSpecialty !== "all" ||
            filterStatus !== "all" ||
            filterYear !== "all" ||
            filterTag !== "all" ||
            onlyFavorites ||
            searchTerm) && (
            <button
              onClick={() => {
                setFilterCongress("all")
                setFilterSpecialty("all")
                setFilterStatus("all")
                setFilterYear("all")
                setFilterTag("all")
                setOnlyFavorites(false)
                setSearchTerm("")
              }}
              className="text-blue-600 hover:underline"
            >
              {t("clearFilters")}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {filtered.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 italic">
              {t("emptyFiltered")}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((ref) => (
              <ReferenceCard key={ref.id} reference={ref} onOpenDetail={setSelectedReference} />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {groupedByCongress.map(([congressName, refs]) => (
              <div key={congressName} className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                  <div className="h-8 w-1 bg-teal-500 rounded-full" />
                  <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                    {congressName}
                  </h3>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                    {t("refCount", { count: refs.length })}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {refs.map((ref) => (
                    <ReferenceCard
                      key={`${congressName}-${ref.id}`}
                      reference={ref}
                      onOpenDetail={setSelectedReference}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReference && draft && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.28em] text-teal-600 font-semibold">
                  {t("detailLabel")}
                </p>
                <h3 className="text-lg font-bold text-slate-900 truncate">
                  {selectedReference.official_title || selectedReference.detected_title || t("noTitle")}
                </h3>
                <p className="text-xs text-slate-500 truncate">{selectedReference.congress_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={deleteSelected}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
                <button
                  onClick={closeReferenceDetail}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Cerrar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-0 flex-1 min-h-0">
              <div className="bg-slate-950 p-4 sm:p-5 overflow-y-auto">
                <div className="space-y-4">
                  {selectedReference.image_full_url ? (
                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl">
                      <img
                        src={selectedReference.image_full_url}
                        alt={t("imageAlt")}
                        className="w-full max-h-[64vh] object-contain bg-black"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/80 p-8 text-center text-slate-300">
                      <FileText className="mx-auto mb-3 h-8 w-8 text-slate-500" />
                      <p className="text-sm font-medium">{t("noImage")}</p>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                          Texto detectado
                        </p>
                        <p className="text-xs text-slate-300">
                          Usa esta evidencia para corregir titulo, autores, DOI o PMID.
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/congresos/${selectedReference.congress_id}?highlight=${selectedReference.image_id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/15 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver diapositiva
                      </Link>
                    </div>
                    <div className="mt-3 max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-3 text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap">
                      {selectedReference.raw_text || t("noOcr")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-y-auto">
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={t("fieldOfficialTitle")}>
                      <input
                        value={draft.official_title}
                        onChange={(e) =>
                          setDraft((prev) => (prev ? { ...prev, official_title: e.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                      />
                    </Field>
                    <Field label={t("fieldOfficialAuthors")}>
                      <input
                        value={draft.official_authors}
                        onChange={(e) =>
                          setDraft((prev) => (prev ? { ...prev, official_authors: e.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                      />
                    </Field>
                    <Field label="Ano">
                      <input
                        value={draft.official_year}
                        onChange={(e) =>
                          setDraft((prev) => (prev ? { ...prev, official_year: e.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                      />
                    </Field>
                    <Field label={t("fieldJournal")}>
                      <input
                        value={draft.official_journal}
                        onChange={(e) =>
                          setDraft((prev) => (prev ? { ...prev, official_journal: e.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                      />
                    </Field>
                    <Field label="DOI">
                      <input
                        value={draft.detected_doi}
                        onChange={(e) =>
                          setDraft((prev) => (prev ? { ...prev, detected_doi: e.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                      />
                    </Field>
                    <Field label={t("fieldPmid")}>
                      <input
                        value={draft.detected_pmid}
                        onChange={(e) =>
                          setDraft((prev) => (prev ? { ...prev, detected_pmid: e.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={t("fieldPubType")}>
                      <input
                        value={draft.publication_type}
                        onChange={(e) =>
                          setDraft((prev) => (prev ? { ...prev, publication_type: e.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                      />
                    </Field>
                    <Field label={t("fieldStatus")}>
                      <select
                        value={draft.verification_status}
                        onChange={(e) =>
                          setDraft((prev) => (prev ? { ...prev, verification_status: e.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 bg-white"
                      >
                        <option value="not_verified">{t("statusNotVerified")}</option>
                        <option value="ambiguous">{t("statusAmbiguous")}</option>
                        <option value="partially_verified">{t("statusPartial")}</option>
                        <option value="verified">{t("statusVerified")}</option>
                        <option value="retracted">{t("statusRetracted")}</option>
                      </select>
                    </Field>
                  </div>

                  <Field label={t("fieldNotes")}>
                    <textarea
                      value={draft.verification_notes}
                      onChange={(e) =>
                        setDraft((prev) => (prev ? { ...prev, verification_notes: e.target.value } : prev))
                      }
                      rows={5}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 resize-y"
                      placeholder={t("notesPlaceholder")}
                    />
                  </Field>

                  <Field label={t("fieldTags")}>
                    <input
                      value={draft.clinical_tags}
                      onChange={(e) =>
                        setDraft((prev) => (prev ? { ...prev, clinical_tags: e.target.value } : prev))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                      placeholder={t("tagsPlaceholder")}
                    />
                  </Field>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(selectedReference)}
                        className={clsx(
                          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition-colors",
                          selectedReference.is_favorite
                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                        )}
                        title={selectedReference.is_favorite ? t("removeFavorite") : t("addFavorite")}
                      >
                        {selectedReference.is_favorite ? `★ ${t("favorite")}` : `☆ ${t("favorite")}`}
                      </button>
                      <button
                        onClick={saveReferenceDetail}
                        disabled={isSavingDetail}
                        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        {isSavingDetail ? t("saving") : t("saveChanges")}
                      </button>
                      <button
                        onClick={confirmSelected}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {t("confirmCorrect")}
                      </button>
                      {(selectedReference.verification_status === "not_verified" ||
                        selectedReference.verification_status === "ambiguous") && (
                        <button
                          onClick={verifySelected}
                          className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100"
                        >
                          <RefreshCw className="h-4 w-4" />
                          {t("reverify")}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {t("detailHelp")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function ReferenceCard({
  reference,
  onOpenDetail,
}: {
  reference: LibraryReference
  onOpenDetail: (reference: LibraryReference) => void
}) {
  const t = useTranslations("library")
  const title = reference.official_title || reference.detected_title || reference.raw_text
  const pubLink = reference.detected_doi
    ? `https://doi.org/${reference.detected_doi}`
    : reference.detected_pmid
      ? `https://pubmed.ncbi.nlm.nih.gov/${reference.detected_pmid}`
      : `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}`

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {reference.is_favorite && (
              <span className="text-[10px] text-amber-500" title={t("favorite")}>★</span>
            )}
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
              {reference.specialty || t("specialtyGeneral")}
            </span>
            {reference.publication_type && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium uppercase">
                {reference.publication_type.replace(/-/g, " ")}
              </span>
            )}
            <Link
              href={`/dashboard/congresos/${reference.congress_id}?highlight=${reference.image_id}`}
              className="text-[10px] text-slate-400 hover:text-blue-500 flex items-center gap-1 font-medium transition-colors ml-auto"
            >
              {reference.congress_name} <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <button onClick={() => onOpenDetail(reference)} className="block text-left w-full group/title">
            <h4
              className={clsx(
                "text-sm font-bold leading-tight group-hover/title:text-teal-600 transition-colors line-clamp-2 underline-offset-2 hover:underline",
                !reference.official_title && !reference.detected_title
                  ? "text-slate-400 italic font-normal"
                  : "text-slate-900"
              )}
            >
              {title.length > 100 ? `${title.substring(0, 100)}...` : title || t("noTitleDetected")}
            </h4>
          </button>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {reference.official_authors || reference.detected_authors || t("noAuthors")}{" "}
            {reference.official_year || reference.detected_year
              ? `· ${reference.official_year || reference.detected_year}`
              : ""}
          </p>
          {reference.clinical_tags && reference.clinical_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {reference.clinical_tags.map((t) => (
                <span key={t} className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-1.5 py-0.5 rounded-full font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenDetail(reference)}
            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all border border-slate-100 flex items-center gap-1 text-[10px] font-bold"
            title={t("viewEdit")}
          >
            <Pencil className="h-3 w-3" />
            DETALLE
          </button>
          {(reference.verification_status === "not_verified" ||
            reference.verification_status === "ambiguous") && (
            <button
              onClick={async () => {
                toast.promise(
                  verifySingleReference({ referenceId: reference.id, congressId: reference.congress_id }),
                  {
                    loading: t("searchingDbs"),
                    success: t("verifyDone"),
                    error: t("verifyErrorNow"),
                  }
                )
              }}
              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-all border border-teal-100 flex items-center gap-1 text-[10px] font-bold"
              title={t("reverifyNow")}
            >
              <RefreshCw className="h-3 w-3" />
              RE-VERIFICAR
            </button>
          )}
          <button
            onClick={async () => {
              const ok = confirm(t("deleteConfirm"))
              if (!ok) return
              const res = await softDeleteReference({ id: reference.id, congressId: reference.congress_id })
              if (res.success) {
                toast.success(t("refDeleted"))
              }
            }}
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title={t("deleteTitle")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <BookOpen className="h-5 w-5 text-slate-200 group-hover:text-teal-100 transition-colors" />
        </div>
      </div>

      {reference.image_url && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50 group/image">
          <img
            src={reference.image_url}
            alt={t("slideAlt")}
            className="h-full w-full object-cover transition-transform duration-500 group-hover/image:scale-110"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
            <Link
              href={`/dashboard/congresos/${reference.congress_id}?highlight=${reference.image_id}`}
              className="bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-white transition-all shadow-lg"
            >
              <ExternalLink className="h-3 w-3" />
              VER DIAPOSITIVA COMPLETA
            </Link>
          </div>
          <div className="absolute bottom-1.5 right-1.5">
            <span className="text-[8px] font-bold text-white bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded uppercase tracking-widest">
              Evidencia Visual
            </span>
          </div>
        </div>
      )}

      {(reference.official_journal || reference.detected_journal) && (
        <p className="text-[10px] font-mono text-teal-600/80 bg-teal-50/50 p-1.5 rounded border border-teal-100/50">
          {reference.official_journal || reference.detected_journal}
        </p>
      )}

      {reference.abstract && (
        <details className="text-xs text-slate-600 bg-slate-50/50 rounded-lg border border-slate-100 overflow-hidden group/details">
          <summary className="px-3 py-2 cursor-pointer font-medium hover:bg-slate-100 transition-colors list-none flex items-center justify-between">
            <span>Ver Resumen (Abstract)</span>
            <ChevronRight className="h-3 w-3 transition-transform group-open/details:rotate-90" />
          </summary>
          <div className="px-3 py-2 border-t border-slate-100 leading-relaxed text-[11px] text-slate-700">
            {reference.abstract}
          </div>
        </details>
      )}

      <div className="mt-auto pt-2 flex flex-col gap-2 border-t border-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={async () => {
                  const nextStatus =
                    reference.verification_status === "verified" ? "ambiguous" : "verified"
                  const res = await updateReferenceCandidate({
                    id: reference.id,
                    congressId: reference.congress_id,
                    updates: { verification_status: nextStatus },
                  })
                  if (res.success) toast.success(t("statusUpdatedTo", { status: nextStatus === "verified" ? t("statusVerified") : t("statusAmbiguous") }))
                }}
                className={clsx(
                  "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border w-fit transition-all flex items-center gap-1 hover:brightness-95",
                  reference.verification_status === "verified"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                    : reference.verification_status === "retracted"
                      ? "border-red-500/40 bg-red-500/10 text-red-600"
                      : reference.verification_status === "ambiguous"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                        : reference.verification_status === "partially_verified"
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                          : "border-slate-300 bg-slate-100 text-slate-500"
                )}
              >
                {reference.verification_status === "verified" ? (
                  <>
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {t("validatedEvidence")}
                  </>
                ) : reference.verification_status === "retracted" ? (
                  <>
                    <AlertCircle className="h-2.5 w-2.5" />
                    {t("retractedShort")}
                  </>
                ) : reference.verification_status === "ambiguous" ? (
                  t("confirmPending")
                ) : reference.verification_status === "partially_verified" ? (
                  t("partialValidation")
                ) : (
                  t("notVerifiedLabel")
                )}
              </button>

              {reference.verification_status === "not_verified" &&
                (!reference.detected_title || !reference.detected_doi) && (
                  <span className="text-[9px] text-amber-600 font-medium flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                    <span className="h-1 w-1 bg-amber-500 rounded-full" />
                    {t("incompleteDetection")}
                  </span>
                )}
            </div>

            {reference.verification_status === "ambiguous" && (
              <button
                onClick={async () => {
                  const res = await updateReferenceCandidate({
                    id: reference.id,
                    congressId: reference.congress_id,
                    updates: { verification_status: "verified" },
                  })
                  if (res.success) toast.success(t("refConfirmed"))
                }}
                className="text-[9px] text-amber-700 font-bold underline hover:text-amber-800"
              >
                {t("confirmCorrect")}
              </button>
            )}

            <div className="flex items-center gap-2">
              {reference.detection_count > 1 && (
                <span className="text-[9px] text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-100 flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
                  </span>
                  Consolidado ({reference.detection_count})
                </span>
              )}
              {reference.citation_count !== null && (
                <span
                  className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100"
                  title={t("citationsTitle")}
                >
                  {reference.citation_count.toLocaleString()} citas
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {reference.mesh_terms && reference.mesh_terms.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[150px]">
                {reference.mesh_terms.slice(0, 2).map((term, i) => (
                  <span
                    key={i}
                    className="text-[8px] bg-slate-50 text-slate-400 px-1 rounded-sm border border-slate-100 uppercase tracking-tighter truncate max-w-[70px]"
                  >
                    {term}
                  </span>
                ))}
              </div>
            )}
            {reference.is_open_access && reference.open_access_url && (
              <a
                href={reference.open_access_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                PDF GRATIS
              </a>
            )}
            {reference.detected_doi && (
              <a
                href={`https://doi.org/${reference.detected_doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-mono text-slate-400 hover:text-teal-600"
                title={reference.detected_doi}
              >
                DOI
              </a>
            )}
            {reference.detected_pmid && (
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${reference.detected_pmid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-mono text-slate-400 hover:text-teal-600"
                title={reference.detected_pmid}
              >
                PMID
              </a>
            )}
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm"
              title={t("searchPubmed")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
