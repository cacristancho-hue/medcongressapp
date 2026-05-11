"use client"

import { ShieldCheck, Info, BookOpen } from "lucide-react"
import Logo from "@/components/ui/md-logo"
import { OpenAIIcon, GeminiIcon, ClaudeIcon, CrossRefIcon, PubMedIcon, OpenAlexIcon } from "@/components/ui/ai-icons"

export default function LegalFooter() {
  return (
    <footer className="mt-auto border-t border-slate-100 bg-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-12">
          {/* Aviso de Responsabilidad - Ahora prominente y central */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800">
              <Info className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-black uppercase tracking-widest">Aviso de Responsabilidad Académica</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 font-medium">
              MDCONGRESS es una herramienta de soporte académico personal diseñada exclusivamente para especialistas médicos y profesionales de la salud. 
              La síntesis de información y bibliografía generada mediante inteligencia artificial no constituye, bajo ninguna circunstancia, diagnóstico médico, consejo clínico ni recomendación de tratamiento. 
              Es responsabilidad inalienable y exclusiva del profesional médico validar toda la evidencia clínica y referencias bibliográficas proporcionadas antes de su aplicación en la práctica médica real.
            </p>
            <div className="flex gap-8 pt-4 border-t border-slate-200">
              <a href="/terms" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Términos de Servicio
              </a>
              <a href="/privacy" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5">
                Privacidad y Seguridad de Datos
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
            {/* Identidad y Potencia */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Logo className="h-10 w-10" />
                <span className="font-extrabold text-slate-900 text-xl tracking-tighter uppercase font-plex-mono">MDCONGRESS</span>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
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
            
            <div className="flex flex-col items-end gap-4 text-[10px] text-slate-400 font-medium">
              <div className="flex items-center gap-3">
                <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-tighter">v1.1.0-stable</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Online
              </div>
              <p>© 2026 MDCONGRESS. Tecnología de Élite para la comunidad médica internacional.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
