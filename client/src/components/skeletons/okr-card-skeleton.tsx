import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, SkeletonAvatar, SkeletonBadge, SkeletonProgressBar } from "@/components/ui/skeleton";

export function GoalCardSkeleton() {
  return (
    <Card className="transition-all duration-200">
      <CardContent className="p-6">
        {/* Header with title and dropdown */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex items-center gap-2">
              <SkeletonBadge className="h-5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-6 w-6" />
        </div>

        {/* Description */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Owner and cycle info */}
        <div className="flex flex-wrap items-center gap-4 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SkeletonAvatar className="w-6 h-6" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Assignee and initiatives section */}
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>

        {/* Progress bars for key results */}
        <div className="space-y-3 mt-4">
          <SkeletonProgressBar />
          <SkeletonProgressBar />
          <SkeletonProgressBar />
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <GoalCardSkeleton key={i} />
      ))}
    </div>
  );
}