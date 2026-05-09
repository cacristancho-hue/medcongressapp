import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-bold text-slate-900 text-lg">MedCongress</span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <span className="inline-block bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Para médicos · Uso académico personal
        </span>
        <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-5">
          Convierte tus fotos de congreso en{" "}
          <span className="text-slate-600">conocimiento organizado</span>
        </h1>
        <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
          Sube hasta 100 fotos de diapositivas y pósters. El sistema extrae el texto,
          organiza por enfermedad, detecta referencias y genera tu reporte académico.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/registro"
            className="inline-flex items-center justify-center rounded-md bg-slate-800 px-6 py-3 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Empezar gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: "📸",
              title: "Sube tus fotos",
              desc: "Hasta 100 fotos por congreso. Diapositivas, pósters, apuntes.",
            },
            {
              icon: "🔍",
              title: "OCR + clasificación",
              desc: "Extracción de texto automática, organizada por enfermedad o tema.",
            },
            {
              icon: "📄",
              title: "Reporte académico",
              desc: "Resumen por tema, bibliografía verificada, listo para exportar.",
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-lg border border-slate-200 p-6">
              <p className="text-3xl mb-3">{feature.icon}</p>
              <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6 text-center">
        <p className="text-xs text-slate-400">
          MedCongress · Uso académico personal · Solo para médicos
        </p>
      </footer>
    </main>
  )
}
