import { ArrowLeft, Sparkles, ClipboardList, ImageIcon, BookCheck, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function TutorialPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al dashboard
      </Link>

      <div className="space-y-10">
        {/* Hero CTA */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-blue-800 px-6 sm:px-10 py-10 sm:py-14 text-white shadow-xl shadow-teal-900/10">
          <svg
            className="absolute right-0 top-0 h-full w-1/2 opacity-15 pointer-events-none"
            viewBox="0 0 400 400"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M0 200 H80 L120 80 L160 320 L200 100 L240 280 L280 200 H400"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Guía de Inicio MDCONGRESS
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold leading-tight">
              Organiza tu conocimiento médico en minutos.
            </h2>
            <p className="mt-3 text-teal-50/90 text-base leading-relaxed">
              MDCONGRESS utiliza Inteligencia Artificial de vanguardia para transformar tus fotos de congresos en una biblioteca académica estructurada y verificada.
            </p>
          </div>
        </div>

        {/* 3 quick steps */}
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-teal-600" />
            El flujo de trabajo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Step
              number="01"
              title="Crea un congreso"
              description="Define el nombre y la especialidad para mantener tus eventos organizados."
              icon={ClipboardList}
            />
            <Step
              number="02"
              title="Sube tus fotos"
              description="La IA optimiza tus imágenes, extrae el texto y detecta los temas clave automáticamente."
              icon={ImageIcon}
            />
            <Step
              number="03"
              title="Verifica la ciencia"
              description="Nuestra IA consulta PubMed y CrossRef para validar cada referencia citada en las diapositivas."
              icon={BookCheck}
            />
          </div>
        </section>

        {/* Quality bullets */}
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <h3 className="text-base font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            Por qué usar MDCONGRESS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <Bullet><b>Multi-IA:</b> Combinamos Claude 3.5 para razonamiento, Gemini para visión y GPT-4o para respaldo.</Bullet>
            <Bullet><b>Rigor Académico:</b> Verificación contra bases de datos mundiales (PubMed, OpenAlex, CrossRef).</Bullet>
            <Bullet><b>Detección de Retracciones:</b> Te avisamos si un artículo citado ha sido retirado de las revistas.</Bullet>
            <Bullet><b>Privacidad Total:</b> No procesamos datos de pacientes, solo conocimiento académico.</Bullet>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Link
            href="/dashboard/congresos/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-8 py-4 text-sm font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            Empezar ahora
          </Link>
        </div>
      </div>
    </div>
  )
}

function Step({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string
  title: string
  description: string
  icon: any
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className="absolute top-6 right-6 font-mono text-xl text-slate-100 font-bold tracking-wider">
        {number}
      </span>
      <div className="inline-flex items-center justify-center rounded-xl bg-teal-50 text-teal-700 w-12 h-12 mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="font-bold text-slate-900 text-base">{title}</h4>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{description}</p>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-slate-600">
      <span className="mt-2 inline-block w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
      <span className="leading-relaxed">{children}</span>
    </div>
  )
}
