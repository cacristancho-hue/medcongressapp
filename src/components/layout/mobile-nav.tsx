"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ClipboardList, BookOpen, PlusCircle, Archive } from "lucide-react"
import { clsx } from "clsx"

const TABS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/congresos", label: "Congresos", icon: ClipboardList },
  { href: "/dashboard/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/dashboard/papelera", label: "Papelera", icon: Archive },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className={clsx(
        "md:hidden fixed bottom-0 left-0 right-0 z-40 print:hidden",
        "bg-white/90 backdrop-blur-lg border-t border-slate-200",
        "px-6 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "flex items-center justify-between"
      )}
    >
      {TABS.slice(0, 2).map((tab) => (
        <NavTab key={tab.href} {...tab} active={pathname === tab.href} />
      ))}

      {/* Floating CTA */}
      <Link
        href="/dashboard/congresos/nuevo"
        aria-label="Nuevo congreso"
        className="bg-gradient-to-br from-teal-500 to-teal-700 p-3 rounded-full text-white shadow-lg shadow-teal-500/30 -mt-8 border-4 border-white active:scale-95 transition-transform"
      >
        <PlusCircle className="w-6 h-6" />
      </Link>

      {TABS.slice(2).map((tab) => (
        <NavTab key={tab.href} {...tab} active={pathname === tab.href} />
      ))}
    </nav>
  )
}

function NavTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: typeof LayoutDashboard
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-teal-700" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <Icon className={clsx("w-5 h-5 transition-transform", active && "scale-110")} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  )
}
