"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"

interface Props {
  onSearch: (term: string) => void
}

export default function CongressSearch({ onSearch }: Props) {
  const [term, setTerm] = useState("")

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(term)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [term, onSearch])

  return (
    <div className="relative group max-w-md w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
      </div>
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar en el OCR de las fotos (ej. dosis, autor, medicamento)..."
        className="block w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
      />
      {term && (
        <button
          onClick={() => setTerm("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-600 text-slate-400 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
