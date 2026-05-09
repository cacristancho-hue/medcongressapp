import ReferenceLibrary from "@/components/congresses/reference-library"
import { getLibraryReferences } from "@/lib/actions/library"
import { BookOpen } from "lucide-react"

export default async function BibliotecaPage() {
  const { data: references, error } = await getLibraryReferences()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Biblioteca de Referencias</h2>
        </div>
        <p className="text-slate-500 text-sm max-w-2xl">
          Explora toda la evidencia científica consolidada de tus congresos. 
          Busca por medicamento, autor o estudio y accede directamente a las fuentes oficiales.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      ) : (
        <ReferenceLibrary initialReferences={references || []} />
      )}
    </div>
  )
}
