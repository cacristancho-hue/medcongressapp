"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LogoutButton({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <button type="button" onClick={handleSignOut} className={className}>
      <LogOut className="h-4 w-4" />
      <span className={compact ? "sr-only" : ""}>Cerrar sesion</span>
    </button>
  )
}
