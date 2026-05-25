"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Sparkles, Loader2 } from "lucide-react"
import { startProCheckout } from "@/lib/actions/billing"

// Kicks off a Lemon Squeezy checkout and redirects the browser to it.
// Billing goes live when NEXT_PUBLIC_BILLING_ENABLED === "true" (set once Lemon
// Squeezy is configured). Until then we show a "coming soon" badge instead of a
// checkout button that can't work yet.
const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true"

export default function UpgradeButton() {
  const t = useTranslations("billing")
  const [pending, startTransition] = useTransition()

  if (!BILLING_ENABLED) {
    return (
      <span
        title={t("comingSoonNote")}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700"
      >
        <Sparkles className="h-4 w-4" />
        {t("comingSoon")}
      </span>
    )
  }

  function handleClick() {
    startTransition(async () => {
      const res = await startProCheckout()
      if (res.error || !res.url) {
        toast.error(res.error ?? t("genericError"))
        return
      }
      window.location.href = res.url
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("processing")}
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          {t("upgrade")}
        </>
      )}
    </button>
  )
}
