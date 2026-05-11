import Link from "next/link"
import { ShieldCheck, BookOpen, FileText, Zap, Microscope, Globe } from "lucide-react"
import Logo from "@/components/ui/md-logo"
import { OpenAIIcon, GeminiIcon, ClaudeIcon, CrossRefIcon, PubMedIcon, OpenAlexIcon } from "@/components/ui/ai-icons"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Premium */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <Logo className="h-10 w-10" />
            <span className="font-bold text-slate-900 text-xl tracking-tighter uppercase font-plex-mono group-hover:text-blue-600 transition-colors">MDCONGRESS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section Élite */}
      <section className="relative px-6 py-24 md:py-32 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#f1f5f9_0%,_transparent_50%)]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-1.5 rounded-full mb-8 border border-blue-100">
            <Globe className="h-3 w-3" />
            Tecnología Médica de Vanguardia
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.95]">
            La inteligencia clínica que organiza sus <span className="text-blue-600">congresos médicos.</span>
          </h1>
          <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Transforme las fotografías de sus conferencias en reportes técnicos y evidencia bibliográfica verificada al instante. Sin ruido, solo ciencia.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-10 py-5 text-base font-bold text-white hover:bg-blue-600 shadow-2xl transition-all active:scale-95"
            >
              Empezar ahora
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-10 py-5 text-base font-bold text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-all"
            >
              Explorar demo
            </Link>
          </div>

          {/* Sello de Confianza y Potencia */}
          <div className="pt-16 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Potenciado por IA de última generación
              </p>
              <div className="flex flex-wrap gap-8 items-center">
                <div className="flex items-center gap-2 group cursor-default">
                  <OpenAIIcon />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">GPT-4o</span>
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <GeminiIcon />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Gemini 1.5</span>
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <ClaudeIcon />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Claude 3.5</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Fuentes de evidencia verificada
              </p>
              <div className="flex flex-wrap gap-6 items-center">
                <CrossRefIcon />
                <PubMedIcon />
                <OpenAlexIcon />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Características de Élite */}
      <section className="max-w-5xl mx-auto px-6 py-24 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              icon: <FileText className="h-10 w-10 text-blue-600" />,
              title: "Resúmenes Académicos",
              desc: "Obtenga la síntesis estructurada de cada charla, organizada por temas clínicos y lista para consulta rápida.",
            },
            {
              icon: <BookOpen className="h-10 w-10 text-blue-600" />,
              title: "Bibliografía Verificada",
              desc: "Acceda a abstracts oficiales y verifique el impacto científico de las citas detectadas en las diapositivas.",
            },
            {
              icon: <ShieldCheck className="h-10 w-10 text-blue-600" />,
              title: "Sesiones Clínicas",
              desc: "Guiones estructurados con rigor científico para replicar y compartir el conocimiento con sus colegas.",
            },
          ].map((feature, i) => (
            <div key={i} className="group bg-white rounded-3xl border border-slate-100 p-10 hover:border-blue-200 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] transition-all duration-500">
              <div className="mb-8 transform group-hover:-translate-y-2 transition-transform duration-500">{feature.icon}</div>
              <h3 className="font-bold text-slate-900 text-xl mb-4 tracking-tighter">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
