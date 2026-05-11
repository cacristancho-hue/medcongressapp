"use client"

import { useState, useMemo } from "react"
import { LibraryReference } from "@/lib/actions/library"
import { Search, BookOpen, ExternalLink, Filter, ChevronRight, Trash2, CheckCircle2, AlertCircle } from "lucide-react"
import { updateReferenceCandidate, softDeleteReference } from "@/lib/actions/references"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { clsx } from "clsx"

interface Props {
  initialReferences: LibraryReference[]
}

export default function ReferenceLibrary({ initialReferences }: Props) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCongress, setFilterCongress] = useState<string>("all")
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterYear, setFilterYear] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "congress">("grid")

  // Obtener listas únicas para los filtros
  const congresses = useMemo(() => {
    const names = new Set(initialReferences.map(r => r.congress_name.split(", ")).flat())
    return Array.from(names).sort()
  }, [initialReferences])

  const specialties = useMemo(() => {
    const names = new Set(initialReferences.map(r => r.specialty).filter(Boolean))
    return Array.from(names).sort()
  }, [initialReferences])

  const years = useMemo(() => {
    const ys = new Set(
      initialReferences
        .map(r => r.detected_year)
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

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return initialReferences.filter(ref => {
      const matchesSearch =
        !term ||
        ref.detected_title?.toLowerCase().includes(term) ||
        ref.detected_authors?.toLowerCase().includes(term) ||
        ref.raw_text.toLowerCase().includes(term) ||
        ref.detected_journal?.toLowerCase().includes(term)

      const matchesCongress = filterCongress === "all" || ref.congress_name.includes(filterCongress)
      const matchesSpecialty = filterSpecialty === "all" || ref.specialty === filterSpecialty
      const matchesStatus = filterStatus === "all" || ref.verification_status === filterStatus
      const matchesYear = filterYear === "all" || ref.detected_year === filterYear

      return matchesSearch && matchesCongress && matchesSpecialty && matchesStatus && matchesYear
    })
  }, [initialReferences, searchTerm, filterCongress, filterSpecialty, filterStatus, filterYear])

  const groupedByCongress = useMemo(() => {
    const groups: Record<string, LibraryReference[]> = {}
    
    // Si estamos en modo congreso, necesitamos "desduplicar" el display 
    // pero permitiendo que la misma referencia aparezca en varios grupos si aplica
    // O mejor, simplemente agrupar por el congress_name principal o iterar sobre todos los nombres
    
    filtered.forEach(ref => {
      const names = ref.congress_name.split(", ")
      names.forEach(name => {
        if (!groups[name]) groups[name] = []
        groups[name].push(ref)
      })
    })

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  return (
    <div className="space-y-6">
      {/* Cabecera y Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, autor o journal..."
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
                  viewMode === "grid" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Vista General
              </button>
              <button
                onClick={() => setViewMode("congress")}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  viewMode === "congress" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Por Congreso
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                className="text-xs border-slate-200 rounded-lg bg-slate-50 py-1.5 pl-2 pr-8"
                value={filterCongress}
                onChange={(e) => setFilterCongress(e.target.value)}
              >
                <option value="all">Todos los congresos</option>
                {congresses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <select
              className="text-xs border-slate-200 rounded-lg bg-slate-50 py-1.5 pl-2 pr-8"
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
            >
              <option value="all">Todas las especialidades</option>
              {specialties.map(s => <option key={s!} value={s!}>{s}</option>)}
            </select>

            <select
              className="text-xs border-slate-200 rounded-lg bg-slate-50 py-1.5 pl-2 pr-8"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Cualquier estado</option>
              <option value="verified">Verificada ({counts.verified})</option>
              <option value="partially_verified">Parcial ({counts.partially_verified})</option>
              <option value="ambiguous">Ambigua ({counts.ambiguous})</option>
              <option value="not_verified">No verificada ({counts.not_verified})</option>
              <option value="retracted">Retractada ({counts.retracted})</option>
            </select>

            <select
              className="text-xs border-slate-200 rounded-lg bg-slate-50 py-1.5 pl-2 pr-8"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">Cualquier año</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-baseline justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>{filtered.length} de {initialReferences.length} referencias</span>
          {(filterCongress !== "all" || filterSpecialty !== "all" || filterStatus !== "all" || filterYear !== "all" || searchTerm) && (
            <button
              onClick={() => {
                setFilterCongress("all")
                setFilterSpecialty("all")
                setFilterStatus("all")
                setFilterYear("all")
                setSearchTerm("")
              }}
              className="text-blue-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de Referencias / Vista por Congreso */}
      <div className="space-y-8">
        {filtered.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 italic">No se encontraron referencias con los filtros actuales.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((ref) => (
              <ReferenceCard key={ref.id} reference={ref} />
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
                    {refs.length} {refs.length === 1 ? 'referencia' : 'referencias'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {refs.map((ref) => (
                    <ReferenceCard key={`${congressName}-${ref.id}`} reference={ref} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReferenceCard({ reference: ref }: { reference: LibraryReference }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
              {ref.specialty || "General"}
            </span>
            {ref.publication_type && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium uppercase">
                {ref.publication_type.replace(/-/g, " ")}
              </span>
            )}
            <Link 
              href={`/dashboard/congresos/${ref.congress_id}?highlight=${ref.image_id}`}
              className="text-[10px] text-slate-400 hover:text-blue-500 flex items-center gap-1 font-medium transition-colors ml-auto"
            >
              {ref.congress_name} <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <h4 className={clsx(
            "text-sm font-bold leading-tight group-hover:text-teal-600 transition-colors",
            (!ref.official_title && !ref.detected_title) ? "text-slate-400 italic font-normal" : "text-slate-900"
          )}>
            {ref.official_title || ref.detected_title || (ref.raw_text.length > 100 ? ref.raw_text.substring(0, 100) + "..." : ref.raw_text) || "Sin título detectado"}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {ref.official_authors || ref.detected_authors || "Autores no detectados"} {ref.official_year || ref.detected_year ? `· ${ref.official_year || ref.detected_year}` : ""}
          </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                const ok = confirm("¿Eliminar esta referencia de la biblioteca?")
                if (!ok) return
                const res = await softDeleteReference({ id: ref.id, congressId: ref.congress_id })
                if (res.success) {
                  toast.success("Referencia eliminada")
                }
              }}
              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Eliminar referencia"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <BookOpen className="h-5 w-5 text-slate-200 group-hover:text-teal-100 transition-colors" />
          </div>
          </div>

          {(ref.official_journal || ref.detected_journal) && (
          <p className="text-[10px] font-mono text-teal-600/80 bg-teal-50/50 p-1.5 rounded border border-teal-100/50">
          {ref.official_journal || ref.detected_journal}
          </p>
          )}

          {ref.abstract && (
          <details className="text-xs text-slate-600 bg-slate-50/50 rounded-lg border border-slate-100 overflow-hidden group/details">
          <summary className="px-3 py-2 cursor-pointer font-medium hover:bg-slate-100 transition-colors list-none flex items-center justify-between">
            <span>Ver Resumen (Abstract)</span>
            <ChevronRight className="h-3 w-3 transition-transform group-open/details:rotate-90" />
          </summary>
          <div className="px-3 py-2 border-t border-slate-100 leading-relaxed text-[11px] text-slate-700">
            {ref.abstract}
          </div>
          </details>
          )}

          <div className="mt-auto pt-2 flex flex-col gap-2 border-t border-slate-50">
          <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={async () => {
                  const nextStatus = ref.verification_status === 'verified' ? 'ambiguous' : 'verified'
                  const res = await updateReferenceCandidate({ 
                    id: ref.id, 
                    congressId: ref.congress_id, 
                    updates: { verification_status: nextStatus } 
                  })
                  if (res.success) toast.success(`Estado actualizado a ${nextStatus}`)
                }}
                className={clsx(
                  "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border w-fit transition-all flex items-center gap-1 hover:brightness-95",
                  ref.verification_status === "verified" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" :
                  ref.verification_status === "retracted" ? "border-red-500/40 bg-red-500/10 text-red-600 animate-pulse" :
                  ref.verification_status === "ambiguous" ? "border-amber-500/40 bg-amber-500/10 text-amber-600" :
                  ref.verification_status === "partially_verified" ? "border-amber-500/40 bg-amber-500/10 text-amber-600" :
                  "border-slate-300 bg-slate-100 text-slate-500"
                )}
              >
                {ref.verification_status === "verified" ? (
                  <>
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Evidencia Validada
                  </>
                ) : ref.verification_status === "retracted" ? (
                  <>
                    <AlertCircle className="h-2.5 w-2.5" />
                    ⚠️ Retractado
                  </>
                ) : ref.verification_status === "ambiguous" ? "Confirmación Pendiente" :
                ref.verification_status === "partially_verified" ? "Validación Parcial" : "No Verificada"}
              </button>

              {ref.verification_status === "not_verified" && (!ref.detected_title || !ref.detected_doi) && (
                <span className="text-[9px] text-amber-600 font-medium flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                  <span className="h-1 w-1 bg-amber-500 rounded-full animate-pulse" />
                  Detección incompleta
                </span>
              )}
            </div>
            {ref.verification_status === "ambiguous" && (
              <button 
                onClick={async () => {
                  const res = await updateReferenceCandidate({ 
                    id: ref.id, 
                    congressId: ref.congress_id, 
                    updates: { verification_status: 'verified' } 
                  })
                  if (res.success) toast.success("Referencia confirmada")
                }}
                className="text-[9px] text-amber-700 font-bold underline hover:text-amber-800"
              >
                Confirmar como correcta
              </button>
            )}
            <div className="flex items-center gap-2">
              {ref.detection_count > 1 && (
                <span className="text-[9px] text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-100 flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
                  </span>
                  Consolidado ({ref.detection_count})
                </span>
              )}
              {ref.citation_count !== null && (
                <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100" title="Citas encontradas en OpenAlex/CrossRef">
                  {ref.citation_count.toLocaleString()} citas
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {ref.mesh_terms && ref.mesh_terms.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[150px]">
                {ref.mesh_terms.slice(0, 2).map((term, i) => (
                  <span key={i} className="text-[8px] bg-slate-50 text-slate-400 px-1 rounded-sm border border-slate-100 uppercase tracking-tighter truncate max-w-[70px]">
                    {term}
                  </span>
                ))}
              </div>
            )}
            {ref.is_open_access && ref.open_access_url && (
              <a 
                href={ref.open_access_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                PDF GRATIS
              </a>
            )}
            {ref.detected_doi && (
              <a 
                href={`https://doi.org/${ref.detected_doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-mono text-slate-400 hover:text-teal-600"
                title={ref.detected_doi}
              >
                DOI
              </a>
            )}
            {ref.detected_pmid && (
              <a 
                href={`https://pubmed.ncbi.nlm.nih.gov/${ref.detected_pmid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-mono text-slate-400 hover:text-teal-600"
                title={ref.detected_pmid}
              >
                PMID
              </a>
            )}
            <a 
              href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(ref.official_title || ref.detected_title || ref.raw_text)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm"
              title="Buscar en PubMed"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
