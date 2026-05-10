import { Skeleton, SkeletonCard } from "@/components/ui/skeleton"

export default function CongresosLoading() {
  return (
    <div className="max-w-4xl space-y-4">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-72 mb-6" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
