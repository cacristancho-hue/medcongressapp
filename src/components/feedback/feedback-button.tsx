"use client"

import { useState, useTransition } from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { MessageSquareWarning, X, Loader2 } from "lucide-react"
import { submitFeedback } from "@/lib/actions/feedback"

// Floating "Report a problem" button + dialog. Available app-wide during the
// build phase so users can flag errors and we get notified.
export default function FeedbackButton() {
  const t = useTranslations("feedback")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [pending, startTransition] = useTransition()

  function handleSend() {
    if (message.trim().length < 3) return
    startTransition(async () => {
      const res = await submitFeedback({ message, email, page: pathname })
      if (!res.ok) {
        toast.error(t("error"))
        return
      }
      toast.success(t("thanks"))
      setMessage("")
      setEmail("")
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={t("button")}
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-lg hover:bg-slate-50 md:bottom-4 print:hidden"
      >
        <MessageSquareWarning className="h-4 w-4 text-amber-600" />
        <span className="hidden sm:inline">{t("button")}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">{t("title")}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{t("subtitle")}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("placeholder")}
              rows={4}
              maxLength={4000}
              autoFocus
              className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSend}
                disabled={pending || message.trim().length < 3}
                className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending ? t("sending") : t("send")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
