"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ClipboardList, BookOpen, PlusCircle } from "lucide-react"
import { clsx } from "clsx"

const TABS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/congresos", label: "Congresos", icon: ClipboardList },
  { href: "/dashboard/biblioteca", label: "Biblioteca", icon: BookOpen },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-6 py-3 flex items-center justify-between z-40 pb-safe-area-inset-bottom">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "flex flex-col items-center gap-1 transition-all",
              isActive ? "text-blue-600 scale-110" : "text-slate-400"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {tab.label}
            </span>
          </Link>
        )
      })}
      
      {/* Botón de Acción Rápida (Cámara simulada vía link a crear o subir) */}
      <Link
        href="/dashboard/congresos"
        className="bg-blue-600 p-3 rounded-full text-white shadow-lg shadow-blue-200 -mt-8 border-4 border-white active:scale-95 transition-transform"
      >
        <PlusCircle className="w-6 h-6" />
      </Link>
    </nav>
  )
}
