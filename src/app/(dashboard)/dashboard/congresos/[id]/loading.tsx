import { Skeleton } from "@/components/ui/skeleton"

export default function CongressDetailLoading() {
  return (
    <div className="max-w-4xl">
      <Skeleton className="h-3 w-32 mb-3" />
      <Skeleton className="h-9 w-2/3 mb-4" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>

      <Skeleton className="h-32 w-full rounded-xl mb-8" />

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  )
}
