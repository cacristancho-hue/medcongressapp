"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { useTranslations } from "next-intl"
import Logo from "@/components/ui/md-logo"
import LogoutButton from "@/components/layout/logout-button"

/**
 * Top bar shown only on mobile. Desktop uses the sidebar header instead.
 * Sticky so it stays visible while scrolling content.
 */
export default function MobileHeader() {
  const t = useTranslations("nav")
  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 print:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <Logo className="h-8 w-8" />
          <span className="font-black text-slate-900 text-sm tracking-tighter uppercase font-plex-mono">
            MDCONGRESS
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/ajustes"
            aria-label={t("settings")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <LogoutButton compact className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-colors" />
        </div>
      </div>
    </header>
  )
}
