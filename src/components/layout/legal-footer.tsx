"use client"

import { ShieldCheck, Info, BookOpen } from "lucide-react"
import { useTranslations } from "next-intl"
import Logo from "@/components/ui/md-logo"
import { OpenAIIcon, GeminiIcon, ClaudeIcon, CrossRefIcon, PubMedIcon, OpenAlexIcon } from "@/components/ui/ai-icons"

export default function LegalFooter() {
  const t = useTranslations("footer")
  return (
    <footer className="mt-auto border-t border-slate-100 bg-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <Logo className="h-10 w-10" />
              <span className="font-extrabold text-slate-900 text-xl tracking-tighter uppercase font-plex-mono">MDCONGRESS</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  {t("techStack")}
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

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                  {t("evidenceSources")}
                </p>
                <div className="flex flex-wrap gap-6 items-center">
                  <CrossRefIcon />
                  <PubMedIcon />
                  <OpenAlexIcon />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:text-right flex flex-col md:items-end">
            <div className="flex items-center gap-2 text-slate-900 md:justify-end">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-black uppercase tracking-widest">{t("disclaimerTitle")}</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 font-medium max-w-md">
              {t("disclaimerBody")}
            </p>

            <div className="flex flex-wrap gap-6 pt-2 md:justify-end">
              <a href="/legal/terminos" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wider">{t("terms")}</a>
              <a href="/legal/privacidad" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wider">{t("privacy")}</a>
            </div>

            <div className="flex flex-col md:items-end gap-2 text-[10px] text-slate-400 font-medium pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("contact")}</p>
              <a href="mailto:cacristanchoo@gmail.com" className="font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                cacristanchoo@gmail.com
              </a>
              <a href="tel:+573057972216" className="font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                +57 305 797 2216
              </a>
            </div>

            <div className="pt-6 flex flex-col md:items-end gap-2 text-[10px] text-slate-400 font-medium">
              <div className="flex items-center gap-3">
                <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-tighter">v1.2.1-hotfix-ai</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                {t("systemOnline")}
              </div>
              <p>{t("copyright")}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
