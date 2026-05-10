"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { clsx } from "clsx"
import { LayoutDashboard, ClipboardList, LogOut, BookOpen, Settings, Archive } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/ui/logo"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types/database"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/congresos", label: "Mis congresos", icon: ClipboardList },
  { href: "/dashboard/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/dashboard/papelera", label: "Papelera", icon: Archive },
  { href: "/dashboard/ajustes", label: "Ajustes", icon: Settings },
]

interface SidebarProps {
  user: User
  profile: Profile | null
}

export default function Sidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const displayName = profile?.full_name ?? user.email ?? "Usuario"

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      <div className="px-5 py-6 border-b border-slate-200">
        <Link href="/dashboard" className="group">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.href === "/dashboard/biblioteca" ? "sidebar-biblioteca" : undefined}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-200">
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
          {profile?.specialty && (
            <p className="text-xs text-slate-500 truncate">{profile.specialty}</p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Cerrar sesión
        </button>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
          <Link href="/dashboard/legal/terminos" className="hover:text-slate-700 transition-colors">
            Términos
          </Link>
          <Link href="/dashboard/legal/privacidad" className="hover:text-slate-700 transition-colors">
            Privacidad
          </Link>
        </div>
      </div>
    </aside>
  )
}
