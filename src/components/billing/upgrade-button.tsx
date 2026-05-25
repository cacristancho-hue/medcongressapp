"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Sparkles, Loader2 } from "lucide-react"
import { startProCheckout } from "@/lib/actions/billing"

// Kicks off a Lemon Squeezy checkout and redirects the browser to it.
export default function UpgradeButton() {
  const t = useTranslations("billing")
  const [pending, startTransition] = useTransition()

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
