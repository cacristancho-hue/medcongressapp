import { Skeleton, SkeletonStatCard } from "@/components/ui/skeleton"

export default function ResumenLoading() {
  return (
    <div className="max-w-5xl mx-auto pb-16">
      <Skeleton className="h-3 w-32 mb-3" />
      <Skeleton className="h-3 w-24 mb-1" />
      <Skeleton className="h-9 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-8" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      <Skeleton className="h-40 w-full rounded-xl mb-8" />
      <Skeleton className="h-64 w-full rounded-xl mb-8" />
    </div>
  )
}
