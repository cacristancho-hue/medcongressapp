import { Skeleton, SkeletonStatCard, SkeletonCard } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl">
      <header className="mb-8 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
      </header>

      <Skeleton className="h-12 w-full mb-8 rounded-lg" />

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </section>

      <Skeleton className="h-3 w-40 mb-4" />
      <div className="space-y-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
