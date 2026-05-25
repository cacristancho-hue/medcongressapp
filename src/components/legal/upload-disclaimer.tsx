"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ShieldAlert, FileText, Sparkles, BookOpenCheck, Server } from "lucide-react"

const ACCEPT_KEY = "MDCONGRESS.disclaimer.accepted.v1"

interface Props {
  onAccept: () => void
}

const POINT_ICONS = [BookOpenCheck, ShieldAlert, Sparkles, BookOpenCheck, Server]

export default function UploadDisclaimer({ onAccept }: Props) {
  const t = useTranslations("disclaimer")
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(ACCEPT_KEY) === "1") {
      onAccept()
    }
  }, [onAccept])

  function handleAccept() {
    if (!checked) return
    localStorage.setItem(ACCEPT_KEY, "1")
    onAccept()
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <FileText className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t("heading")}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            {t("readFullPre")}{" "}
            <Link
              href="/legal/terminos"
              className="underline underline-offset-2 hover:text-slate-900"
            >
              {t("termsLink")}
            </Link>{" "}
            {t("and")}{" "}
            <Link
              href="/legal/privacidad"
              className="underline underline-offset-2 hover:text-slate-900"
            >
              {t("privacyLink")}
            </Link>
            .
          </p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {POINT_ICONS.map((Icon, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Icon className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-800">{t(`p${i + 1}t`)}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{t(`p${i + 1}`)}</p>
            </div>
          </li>
        ))}
      </ul>

      <label className="flex items-start gap-2.5 pt-2 border-t border-amber-200/70 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-700"
        />
        <span className="text-xs text-slate-700 leading-relaxed">
          {t("checkboxPre")}{" "}
          <strong className="font-semibold">{t("checkboxStrong")}</strong>{" "}
          {t("checkboxPost")}
        </span>
      </label>

      <button
        onClick={handleAccept}
        disabled={!checked}
        className="w-full rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2.5 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {t("accept")}
      </button>

      <p className="text-[10px] text-slate-500 text-center">
        {t("saved")}
      </p>
    </div>
  )
}
