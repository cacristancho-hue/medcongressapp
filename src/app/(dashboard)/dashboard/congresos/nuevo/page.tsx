import CongressForm from "@/components/congresses/congress-form"

export default function NuevoCongresoPage() {
  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Nuevo congreso</h2>
        <p className="text-slate-500 text-sm mt-1">
          Registra el evento académico donde tomaste tus fotos.
        </p>
      </div>
      <CongressForm />
    </div>
  )
}
