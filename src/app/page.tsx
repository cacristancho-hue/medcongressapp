import Link from "next/link"
import { ShieldCheck, BookOpen, FileText, Globe } from "lucide-react"
import Logo from "@/components/ui/md-logo"
import { OpenAIIcon, GeminiIcon, ClaudeIcon } from "@/components/ui/ai-icons"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Premium */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Logo className="h-10 w-10" />
            <span className="font-black text-black text-[11px] tracking-[0.4em] uppercase font-plex-mono group-hover:text-blue-600 transition-colors mt-0.5">
              CONGRESS
            </span>
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
      <section className="relative px-6 py-12 md:py-16 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#f1f5f9_0%,_transparent_50%)]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Logotipo Central Monumental: Isotipo MD + CONGRESS */}
          <div className="flex flex-col items-center mb-12 group cursor-default">
            <div className="transform hover:scale-110 transition-transform duration-700">
              <Logo className="h-32 w-32 md:h-44 md:w-44 drop-shadow-[0_35px_60px_-15px_rgba(37,99,235,0.3)]" />
            </div>
            
            <div className="mt-[-8px] md:mt-[-12px] relative overflow-hidden">
              {/* Palabra CONGRESS - Más pequeño y pegado al Isotipo */}
              <h2 className="text-xl md:text-3xl font-black tracking-[0.6em] text-black uppercase font-plex-mono leading-none py-1">
                CONGRESS
              </h2>
              
              {/* Efecto de Iluminación Etérea (No titila, fluye) */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_10s_infinite] skew-x-[-20deg]"></div>
            </div>
            
            {/* Línea de Soporte Visual - Unificadora */}
            <div className="w-12 h-1 bg-blue-600 mt-1 rounded-full opacity-30 group-hover:w-24 transition-all duration-1000"></div>
          </div>

          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-1.5 rounded-full mb-6 border border-blue-100">
            <Globe className="h-3 w-3" />
            Actualización Médica de Élite
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-[0.95]">
            Estructuramos sus <span className="text-blue-600">fotos de congresos</span> en conocimiento médico.
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Transforme sus capturas visuales en reportes técnicos y bibliografía verificada al instante. Sin ruido, solo ciencia.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-10 py-5 text-base font-bold text-white hover:bg-slate-900 shadow-[0_20px_50px_rgba(37,99,235,0.2)] transition-all active:scale-95"
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
        </div>
      </section>

      {/* Sustento Tecnológico de Élite - Explicación de Utilidad */}
      <section className="bg-slate-900 py-20 px-6 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-[0.3em] mb-4">Arquitectura de Inteligencia Triple</h2>
            <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">Sustentado por los líderes mundiales en IA</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <OpenAIIcon />
                <span className="text-white font-bold">OpenAI</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                <strong className="text-slate-200">Precisión Clínica:</strong> Motor principal para la auditoría de integridad y validación de datos médicos complejos.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <GeminiIcon />
                <span className="text-white font-bold">Google Gemini</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                <strong className="text-slate-200">Visión de Vanguardia:</strong> Especializado en la captura masiva de diapositivas y detección instantánea de referencias.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <ClaudeIcon />
                <span className="text-white font-bold">Anthropic Claude</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                <strong className="text-slate-200">Síntesis Académica:</strong> Responsable de redactar guiones de ponencia con un tono médico de postgrado impecable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Características de Élite */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              icon: <FileText className="h-10 w-10 text-blue-600" />,
              title: "Reportes Estructurados",
              desc: "Obtenga la síntesis técnica de cada ponencia, organizada por ejes temáticos y lista para sesiones clínicas.",
            },
            {
              icon: <BookOpen className="h-10 w-10 text-blue-600" />,
              title: "Bibliografía de Soporte",
              desc: "Acceda a abstracts oficiales y verifique el impacto científico de las citas detectadas en las diapositivas.",
            },
            {
              icon: <ShieldCheck className="h-10 w-10 text-blue-600" />,
              title: "Rigor y Verificación",
              desc: "Filtramos el ruido visual para entregarle solo información validada con los más altos estándares académicos.",
            },
          ].map((feature, i) => (
            <div key={i} className="group bg-white rounded-3xl border border-slate-100 p-10 hover:border-blue-100 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] transition-all duration-500">
              <div className="mb-8 transform group-hover:-translate-y-1 transition-transform duration-500">{feature.icon}</div>
              <h3 className="font-bold text-slate-900 text-xl mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
