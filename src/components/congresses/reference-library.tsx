"use client"

import { useState, useMemo } from "react"
import { LibraryReference } from "@/lib/actions/library"
import { Search, BookOpen, ExternalLink, Filter, ChevronRight } from "lucide-react"
import Link from "next/link"
import { clsx } from "clsx"

interface Props {
  initialReferences: LibraryReference[]
}

export default function ReferenceLibrary({ initialReferences }: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCongress, setFilterCongress] = useState<string>("all")
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all")

  // Obtener listas únicas para los filtros
  const congresses = useMemo(() => {
    const names = new Set(initialReferences.map(r => r.congress_name))
    return Array.from(names).sort()
  }, [initialReferences])

  const specialties = useMemo(() => {
    const names = new Set(initialReferences.map(r => r.specialty).filter(Boolean))
    return Array.from(names).sort()
  }, [initialReferences])

  const filtered = useMemo(() => {
    return initialReferences.filter(ref => {
      const matchesSearch = 
        ref.detected_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.detected_authors?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.raw_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.detected_journal?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCongress = filterCongress === "all" || ref.congress_name === filterCongress
      const matchesSpecialty = filterSpecialty === "all" || ref.specialty === filterSpecialty

      return matchesSearch && matchesCongress && matchesSpecialty
    })
  }, [initialReferences, searchTerm, filterCongress, filterSpecialty])

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
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      {/* Grid de Referencias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 italic">No se encontraron referencias con los filtros actuales.</p>
          </div>
        ) : (
          filtered.map((ref) => (
            <div key={ref.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                      {ref.specialty || "General"}
                    </span>
                    <Link 
                      href={`/dashboard/congresos/${ref.congress_id}?highlight=${ref.image_id}`}
                      className="text-[10px] text-slate-400 hover:text-blue-500 flex items-center gap-1 font-medium transition-colors"
                    >
                      {ref.congress_name} <ChevronRight className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                    {ref.detected_title || "Sin título detectado"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {ref.detected_authors} {ref.detected_year ? `· ${ref.detected_year}` : ""}
                  </p>
                </div>
                <BookOpen className="h-5 w-5 text-slate-200 group-hover:text-blue-100 transition-colors shrink-0" />
              </div>

              {ref.detected_journal && (
                <p className="text-[10px] font-mono text-blue-500/80 bg-blue-50/50 p-1.5 rounded border border-blue-100/50">
                  {ref.detected_journal}
                </p>
              )}

              <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-50">
                <span className={clsx(
                  "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border",
                  ref.verification_status === "verified" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" :
                  ref.verification_status === "partially_verified" ? "border-amber-500/40 bg-amber-500/10 text-amber-400" :
                  "border-slate-700 bg-slate-800 text-slate-500"
                )}>
                  {ref.verification_status === "verified" ? "Evidencia Validada" : 
                   ref.verification_status === "partially_verified" ? "Validación Parcial" : "Pendiente"}
                </span>

                <div className="flex items-center gap-2">
                  <a 
                    href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(ref.detected_title || ref.raw_text)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    title="Buscar en PubMed"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
