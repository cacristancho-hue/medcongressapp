import Link from "next/link"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
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

  const t = await getTranslations("footer")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-bg)] print:bg-white">
      <div className="hidden md:block print:hidden flex-shrink-0">
        <Sidebar user={user} profile={profile} />
      </div>

      <MobileHeader />

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 print:p-0 print:m-0 pb-24 md:pb-8">
        {children}
      </main>

      <footer className="print:hidden px-4 sm:px-6 lg:px-8 pb-4 md:pb-6">
        <div className="mx-auto max-w-5xl border-t border-slate-200/70 pt-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-wider">
              <Link href="/dashboard/legal/terminos" className="text-blue-600 hover:underline">
                {t("terms")}
              </Link>
              <Link href="/dashboard/legal/privacidad" className="text-blue-600 hover:underline">
                {t("privacy")}
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-[11px] uppercase tracking-[0.16em] text-slate-400">
              <span className="font-semibold text-slate-500">{t("contact")}</span>
              <a
                href="mailto:cacristanchoo@gmail.com"
                className="font-semibold text-slate-600 hover:text-blue-600 transition-colors"
              >
                cacristanchoo@gmail.com
              </a>
              <span className="hidden sm:inline text-slate-300">•</span>
              <a
                href="tel:+573057972216"
                className="font-semibold text-slate-600 hover:text-blue-600 transition-colors"
              >
                +57 305 797 2216
              </a>
            </div>
            <p className="pt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              {t("createdBy")} <span className="font-semibold text-slate-600">Camilo Cristancho</span>{t("createdByRole")}
            </p>
          </div>
        </div>
      </footer>

      <div className="print:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
