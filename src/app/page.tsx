import Link from "next/link"
import { ShieldCheck, BookOpen, FileText, Zap } from "lucide-react"
import Logo from "@/components/ui/md-logo"
import { OpenAIIcon, GeminiIcon, ClaudeIcon } from "@/components/ui/ai-icons"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Premium */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Logo className="h-9 w-9" />
            <span className="font-bold text-slate-900 text-xl tracking-tight uppercase group-hover:text-blue-600 transition-colors">MDCONGRESS</span>
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
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section Élite */}
      <section className="relative px-6 py-24 md:py-32 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full mb-8 border border-blue-100">
            <Zap className="h-3 w-3 animate-pulse" />
            Actualización Médica Inteligente
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
            La inteligencia clínica que organiza sus <span className="text-blue-600">congresos médicos.</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Transforme las fotografías de sus conferencias en reportes técnicos y evidencia bibliográfica verificada al instante. Sin ruido, solo ciencia.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white hover:bg-blue-600 shadow-xl transition-all active:scale-95"
            >
              Empezar ahora
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border-2 border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-all"
            >
              Explorar demo
            </Link>
          </div>
        </div>
      </section>

      {/* Características de Élite */}
      <section className="max-w-5xl mx-auto px-6 py-20 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <FileText className="h-8 w-8 text-blue-600" />,
              title: "Resúmenes Académicos",
              desc: "Obtenga la síntesis estructurada de cada charla, organizada por temas clínicos y lista para consulta rápida.",
            },
            {
              icon: <BookOpen className="h-8 w-8 text-blue-600" />,
              title: "Bibliografía Verificada",
              desc: "Acceda a abstracts oficiales y verifique el impacto científico de las citas detectadas en las diapositivas.",
            },
            {
              icon: <ShieldCheck className="h-8 w-8 text-blue-600" />,
              title: "Sesiones Clínicas",
              desc: "Guiones estructurados con rigor científico para replicar y compartir el conocimiento con sus colegas.",
            },
          ].map((feature, i) => (
            <div key={i} className="group bg-white rounded-2xl border border-slate-100 p-8 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-50 transition-all duration-300">
              <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
              <h3 className="font-bold text-slate-900 text-lg mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
