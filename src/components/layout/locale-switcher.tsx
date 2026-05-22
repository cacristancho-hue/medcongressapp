"use client"

import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Globe } from "lucide-react"
import { setLocale } from "@/lib/actions/locale"
import { SUPPORTED_LOCALES, LOCALE_LABELS } from "@/i18n/config"

// Cookie-based language switcher. Sets the LOCALE cookie via a server action and
// refreshes so server components re-render with the new dictionary.
export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <label className={`inline-flex items-center gap-1.5 text-xs text-slate-500 ${className ?? ""}`}>
      <Globe className="h-3.5 w-3.5" />
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value
          startTransition(async () => {
            await setLocale(next)
            router.refresh()
          })
        }}
        className="bg-transparent text-xs font-medium text-slate-600 outline-none cursor-pointer disabled:opacity-50"
        aria-label="Idioma / Language"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  )
}
