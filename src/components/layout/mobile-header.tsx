"use client"

import Link from "next/link"
import Logo from "@/components/ui/md-logo"

/**
 * Top bar shown only on mobile. Desktop uses the sidebar header instead.
 * Sticky so it stays visible while scrolling content.
 */
export default function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 print:hidden">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <Logo className="h-8 w-8" />
          <span className="font-black text-slate-900 text-sm tracking-tighter uppercase font-plex-mono">
            MDCONGRESS
          </span>
        </Link>
      </div>
    </header>
  )
}
