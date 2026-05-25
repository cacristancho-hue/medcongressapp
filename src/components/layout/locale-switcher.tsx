"use client"

import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { setLocale } from "@/lib/actions/locale"
import { SUPPORTED_LOCALES, LOCALE_LABELS } from "@/i18n/config"

// Cookie-based language switcher rendered as a segmented pill toggle (ES|EN).
// Sets the LOCALE cookie via a server action and refreshes so server components
// re-render with the new dictionary. Consistent look across every browser/OS.
export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function switchTo(next: string) {
    if (next === locale || pending) return
    startTransition(async () => {
      await setLocale(next)
      router.refresh()
    })
  }

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className={`inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5 ${className ?? ""}`}
    >
      {SUPPORTED_LOCALES.map((l) => {
        const active = l === locale
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            disabled={pending}
            aria-pressed={active}
            title={LOCALE_LABELS[l]}
            className={`rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-50 ${
              active
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}
