"use client"

import { ShieldCheck, Info } from "lucide-react"

export default function LegalFooter() {
  return (
    <footer className="mt-auto border-t border-slate-100 bg-slate-50/50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Sello de Potencia IA */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" />
              MDCONGRESS Intelligence
            </h4>
            <div className="flex flex-wrap gap-4 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <span className="text-xs font-bold text-slate-600">Powered by OpenAI</span>
              <span className="text-xs font-bold text-slate-600">Google Gemini</span>
              <span className="text-xs font-bold text-slate-600">Anthropic Claude</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Triangulación de evidencia Multi-LLM v2026.
            </p>
          </div>

          {/* Blindaje Legal */}
          <div className="md:max-w-md space-y-2">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Info className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-tight">Aviso Legal y Académico</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              MDCONGRESS es una herramienta de soporte exclusivamente para fines educativos y de investigación bibliográfica. 
              La información generada por IA no constituye consejo médico, diagnóstico ni tratamiento. 
              Es responsabilidad inalienable del profesional de la salud validar la evidencia clínica 
              proporcionada antes de cualquier aplicación en la práctica médica.
            </p>
            <div className="flex gap-4 pt-1">
              <a href="/terms" className="text-[10px] font-bold text-blue-500/70 hover:text-blue-600 transition-colors">Términos de Uso</a>
              <a href="/privacy" className="text-[10px] font-bold text-blue-500/70 hover:text-blue-600 transition-colors">Privacidad de Datos</a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
          <p className="text-[10px] text-slate-400">© 2026 MDCONGRESS. All rights reserved.</p>
          <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">v1.0.4-elite</span>
        </div>
      </div>
    </footer>
  )
}
