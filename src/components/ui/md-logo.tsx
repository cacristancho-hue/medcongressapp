"use client"

import { Microscope, Zap, ShieldCheck, Activity } from "lucide-react"

export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`group relative flex items-center justify-center transition-all duration-500 ${className}`}>
      {/* Halo de luz sutil */}
      <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700"></div>
      
      {/* Contenedor del Logo */}
      <div className="relative z-10 flex items-center justify-center w-full h-full bg-slate-900 rounded-xl shadow-xl border border-white/10 group-hover:border-blue-400/50 transition-colors">
        <svg viewBox="0 0 40 40" className="w-8/12 h-8/12 fill-white group-hover:fill-blue-400 transition-colors duration-500">
          <path d="M12 8H18L20 16L22 8H28V32H24V14L22 22H18L16 14V32H12V8Z" />
        </svg>
        
        {/* Indicador de "Poder Tecnológico" */}
        <div className="absolute -top-1 -right-1 flex gap-0.5">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:200ms]"></div>
          <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse [animation-delay:400ms]"></div>
        </div>
      </div>
    </div>
  )
}
