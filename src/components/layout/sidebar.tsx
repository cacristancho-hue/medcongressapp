"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { clsx } from "clsx"
import { LayoutDashboard, ClipboardList, LogOut, BookOpen, Settings, Archive, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Logo from "@/components/ui/md-logo"
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
    <aside className="w-64 min-h-screen bg-white border-r border-slate-100 flex flex-col shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
      <div className="px-6 py-8">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <Logo className="h-11 w-11" />
          <span className="font-black text-slate-900 text-[13px] tracking-[0.4em] uppercase font-plex-mono group-hover:text-blue-600 transition-colors mt-0.5">
            CONGRESS
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.href === "/dashboard/biblioteca" ? "sidebar-biblioteca" : undefined}
              className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300",
                pathname === item.href
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                  : "text-slate-500 hover:bg-blue-50 hover:text-blue-600 font-medium"
              )}
            >
              <Icon className={clsx("w-4 h-4", pathname === item.href ? "text-blue-400" : "text-current")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-6 border-t border-slate-50 bg-slate-50/50">
        <div className="mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-blue-500" />
            Perfil verificado
          </p>
          <p className="text-sm font-black text-slate-900 truncate tracking-tight">{displayName}</p>
          {profile?.specialty && (
            <p className="text-[10px] text-blue-600 font-bold uppercase mt-0.5">{profile.specialty}</p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-tighter"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
