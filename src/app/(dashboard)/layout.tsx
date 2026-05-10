import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/layout/sidebar"
import MobileNav from "@/components/layout/mobile-nav"
import MobileHeader from "@/components/layout/mobile-header"

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
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-bg)] print:bg-white">
      {/* Sidebar - desktop */}
      <div className="hidden md:block print:hidden flex-shrink-0">
        <Sidebar user={user} profile={profile} />
      </div>

      {/* Mobile top bar with logo */}
      <MobileHeader />

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 print:p-0 print:m-0 pb-24 md:pb-8">
        {children}
      </main>

      <div className="print:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
