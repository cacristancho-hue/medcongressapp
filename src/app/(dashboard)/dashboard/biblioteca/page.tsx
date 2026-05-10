import ReferenceLibrary from "@/components/congresses/reference-library"
import { getLibraryReferences } from "@/lib/actions/library"
import { BookOpen } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export default async function BibliotecaPage() {
  const { data: references, error } = await getLibraryReferences()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center justify-center bg-teal-600 p-2 rounded-lg shadow-md shadow-teal-200">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Biblioteca de referencias
          </h2>
        </div>
        <p className="text-slate-500 text-sm max-w-2xl">
          Toda la evidencia científica consolidada de tus congresos, verificada contra
          CrossRef, PubMed y OpenAlex.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      ) : !references || references.length === 0 ? (
        <EmptyState
          illustration="library"
          size="lg"
          title="Tu biblioteca está vacía"
          description="Cuando proceses fotos de un congreso con IA, las referencias bibliográficas detectadas aparecerán aquí, verificadas contra CrossRef, PubMed y OpenAlex."
          action={{ label: "Crear un congreso", href: "/dashboard/congresos/nuevo", primary: true }}
          secondaryAction={{ label: "Ver mis congresos", href: "/dashboard/congresos" }}
        />
      ) : (
        <ReferenceLibrary initialReferences={references} />
      )}
    </div>
  )
}
