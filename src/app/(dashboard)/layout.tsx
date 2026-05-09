import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/layout/sidebar"
import MobileNav from "@/components/layout/mobile-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 print:bg-white">
      {/* Sidebar Desktop */}
      <div className="hidden md:block print:hidden flex-shrink-0">
        <Sidebar user={user} profile={profile} />
      </div>

      <main className="flex-1 min-w-0 p-6 lg:p-8 print:p-0 print:m-0 pb-24 md:pb-8">
        {children}
      </main>

      {/* Navegación Móvil */}
      <div className="print:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
