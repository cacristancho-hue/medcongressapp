"use client"

import { ShieldCheck, Info, BookOpen } from "lucide-react"
import Logo from "@/components/ui/md-logo"
import { OpenAIIcon, GeminiIcon, ClaudeIcon, CrossRefIcon, PubMedIcon, OpenAlexIcon } from "@/components/ui/ai-icons"

export default function LegalFooter() {
  return (
    <footer className="mt-auto border-t border-slate-100 bg-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Identidad y Potencia */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <Logo className="h-10 w-10" />
              <span className="font-extrabold text-slate-900 text-xl tracking-tighter uppercase font-plex-mono">MDCONGRESS</span>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  Soporte Tecnológico Multi-IA
                </p>
                <div className="flex flex-wrap gap-8 items-center">
                  <div className="flex items-center gap-2 group cursor-default">
                    <OpenAIIcon />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">OpenAI</span>
                  </div>
                  <div className="flex items-center gap-2 group cursor-default">
                    <GeminiIcon />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Google Gemini</span>
                  </div>
                  <div className="flex items-center gap-2 group cursor-default">
                    <ClaudeIcon />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Anthropic Claude</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                  Fuentes de Evidencia Científica
                </p>
                <div className="flex flex-wrap gap-6 items-center">
                  <CrossRefIcon />
                  <PubMedIcon />
                  <OpenAlexIcon />
                </div>
              </div>
            </div>
          </div>

          {/* Blindaje Legal */}
          <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <Info className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-tight">Aviso de Responsabilidad Académica</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              MDCONGRESS es una herramienta de soporte académico personal para especialistas médicos. 
              La síntesis generada por inteligencia artificial no constituye diagnóstico ni consejo médico. 
              Es responsabilidad del profesional validar la evidencia clínica antes de su aplicación.
            </p>
            <div className="flex gap-6 pt-2 border-t border-slate-200">
              <a href="/terms" className="text-[11px] font-bold text-blue-600 hover:underline">Términos de Servicio</a>
              <a href="/privacy" className="text-[11px] font-bold text-blue-600 hover:underline">Privacidad y Seguridad</a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 font-medium">
          <p>© 2026 MDCONGRESS. Tecnología de Élite para la comunidad médica internacional.</p>
          <div className="flex items-center gap-3">
            <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-tighter">v1.1.0-stable</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Online
          </div>
        </div>
      </div>
    </footer>
  )
}
