import Link from "next/link"
import { Logo } from "@/components/ui/logo"

/**
 * Top bar shown only on mobile. Desktop uses the sidebar header instead.
 * Sticky so it stays visible while scrolling content.
 */
export default function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200 print:hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="group">
          <Logo size="sm" />
        </Link>
      </div>
    </header>
  )
}
