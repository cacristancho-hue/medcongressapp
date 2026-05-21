"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, FileText, ExternalLink, X } from "lucide-react"
import { searchGlobalOCR, SearchResult } from "@/lib/actions/search"
import Link from "next/link"

export default function GlobalSearch() {
  const [term, setTerm] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (term.length < 3) {
        setResults([])
        return
      }

      setIsSearching(true)
      const { data } = await searchGlobalOCR(term)
      setResults(data || [])
      setIsSearching(false)
      setIsOpen(true)
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [term])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mb-8">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => term.length >= 3 && setIsOpen(true)}
          placeholder="Buscar en congresos, autores o OCR"
          className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
        />
        {term && (
          <button
            onClick={() => {
              setTerm("")
              setResults([])
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-600 text-slate-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && term.length >= 3 && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-h-[400px] flex flex-col">
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
              {results.length} coincidencias encontradas
            </span>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {results.length === 0 && !isSearching ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No se encontraron resultados para esta busqueda.</p>
              </div>
            ) : (
              results.map((res) => (
                <Link
                  key={res.image_id}
                  href={`/dashboard/congresos/${res.congress_id}`}
                  className="block p-4 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 group"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                          {res.specialty || "Medico"}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {res.congress_name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2 truncate italic">
                        &quot;...{res.cleaned_text.substring(0, 120)}...&quot;
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {res.original_filename}
                        </span>
                        <span className="flex items-center gap-1 text-blue-500 font-medium">
                          Ver en contexto <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
