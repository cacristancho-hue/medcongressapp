"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShieldAlert, FileText, Sparkles, BookOpenCheck, Server } from "lucide-react"

const ACCEPT_KEY = "MDCONGRESS.disclaimer.accepted.v1"

interface Props {
  onAccept: () => void
}

const POINTS = [
  {
    icon: BookOpenCheck,
    title: "Uso académico personal",
    text: "Esta herramienta organiza material de congresos para tu estudio personal. No es un dispositivo médico ni reemplaza el criterio clínico.",
  },
  {
    icon: ShieldAlert,
    title: "Sin datos identificables de pacientes",
    text: "No subas imágenes con nombres, identificación, números de historia, fotografías clínicas con identidad u otra información que permita identificar a un paciente.",
  },
  {
    icon: Sparkles,
    title: "Las síntesis con IA son aproximadas",
    text: "Los resúmenes generados por IA son aproximaciones académicas. Verifica siempre la información antes de usarla en práctica clínica, docencia o publicación.",
  },
  {
    icon: BookOpenCheck,
    title: "Verificación bibliográfica probabilística",
    text: "Las referencias se marcan como verificada, parcial, ambigua o no verificada. Confirma manualmente cualquier cita antes de publicarla.",
  },
  {
    icon: Server,
    title: "Procesamiento por terceros",
    text: "Tus imágenes y textos pueden pasar por servicios de IA externos (por ejemplo OpenAI, Anthropic, Google) y por Supabase. Al continuar autorizas este procesamiento.",
  },
]

export default function UploadDisclaimer({ onAccept }: Props) {
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
            Antes de subir fotos, confirma lo siguiente
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Lee los puntos completos en{" "}
            <Link
              href="/legal/terminos"
              className="underline underline-offset-2 hover:text-slate-900"
            >
              Términos de uso
            </Link>{" "}
            y{" "}
            <Link
              href="/legal/privacidad"
              className="underline underline-offset-2 hover:text-slate-900"
            >
              Política de privacidad
            </Link>
            .
          </p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-2.5">
            <Icon className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-800">{title}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
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
          He leído y acepto los términos. Confirmo que las imágenes que voy a subir{" "}
          <strong className="font-semibold">no contienen datos identificables de pacientes</strong>{" "}
          y que el uso es académico personal.
        </span>
      </label>

      <button
        onClick={handleAccept}
        disabled={!checked}
        className="w-full rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2.5 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Acepto y quiero subir fotos
      </button>

      <p className="text-[10px] text-slate-500 text-center">
        Esta confirmación se guarda en este navegador. Puedes revocarla en cualquier momento desde
        Ajustes.
      </p>
    </div>
  )
}
