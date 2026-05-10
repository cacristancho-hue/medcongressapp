import { Skeleton } from "@/components/ui/skeleton"

export default function BibliotecaLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-7 w-64" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
