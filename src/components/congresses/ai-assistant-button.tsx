"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Sparkles, Loader2, CheckCircle2, XCircle, Minus, Clock } from "lucide-react"
import { runMedicalAssistant, type AssistantStep } from "@/lib/actions/assistant"

interface Props {
  congressId: string
  language?: "es" | "en"
}

const STEP_LABEL_KEY: Record<AssistantStep["key"], string> = {
  topics: "stepTopics",
  references: "stepReferences",
  report: "stepReport",
}

const DETAIL_KEY: Record<string, string> = {
  instantDone: "detailInstantDone",
  instantFailRetry: "detailInstantFailRetry",
  alreadyRunning: "detailAlreadyRunning",
  queued: "detailQueued",
  alreadyDone: "detailAlreadyDone",
  noOcr: "detailNoOcr",
  enqueueError: "detailEnqueueError",
  noPending: "detailNoPending",
  alreadyExists: "detailAlreadyExists",
}

export default function AiAssistantButton({ congressId, language = "es" }: Props) {
  const t = useTranslations("assistant")
  const [isPending, startTransition] = useTransition()
  const [steps, setSteps] = useState<AssistantStep[] | null>(null)
  const router = useRouter()

  function handleClick() {
    const ok = confirm(t("confirm"))
    if (!ok) return

    startTransition(async () => {
      const result = await runMedicalAssistant(congressId, language)
      if (result.errorCode) {
        toast.error(t(result.errorCode))
        return
      }
      setSteps(result.steps)
      const queued = result.steps.filter((s) => s.status === "queued").length
      const skipped = result.steps.filter((s) => s.status === "skipped").length
      const failed = result.steps.filter((s) => s.status === "error").length

      if (failed > 0) {
        toast.warning(t("toastWarning", { queued, skipped, failed }))
      } else if (queued > 0) {
        toast.success(t("toastQueued", { queued }))
      } else {
        toast.info(t("toastDone"))
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2.5 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("starting")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {t("start")}
          </>
        )}
      </button>

      {isPending && (
        <p className="text-xs text-slate-500">
          {t("enqueuing")}
        </p>
      )}

      {steps && (
        <ul className="space-y-1.5 pt-2 border-t border-slate-100">
          {steps.map((step) => {
            const Icon =
              step.status === "queued"
                ? Clock
                : step.status === "success" || step.status === "skipped"
                  ? CheckCircle2
                  : step.status === "error"
                    ? XCircle
                    : Minus
            const tone =
              step.status === "queued"
                ? "text-blue-500"
                : step.status === "success" || step.status === "skipped"
                  ? "text-emerald-600"
                  : step.status === "error"
                    ? "text-red-600"
                    : "text-slate-400"
            return (
              <li
                key={step.key}
                className="flex items-start gap-2 text-xs text-slate-700"
              >
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${tone}`} />
                <span>
                  <span className="font-medium">{t(STEP_LABEL_KEY[step.key])}</span>
                  {step.detailCode && (
                    <span className="text-slate-500"> · {t(DETAIL_KEY[step.detailCode])}</span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
