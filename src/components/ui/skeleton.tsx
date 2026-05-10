import { cn } from "@/lib/utils"

/**
 * Premium skeleton primitive. Uses a subtle animated gradient instead of a
 * pulsing block — feels more "loading content" and less "broken".
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80",
        className
      )}
      {...props}
    />
  )
}

export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-2">
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-7 w-1/3" />
    </div>
  )
}
