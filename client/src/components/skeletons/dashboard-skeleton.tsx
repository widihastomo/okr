import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton, SkeletonAvatar, SkeletonBadge, SkeletonButton } from "@/components/ui/skeleton";

export function StatsOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="w-12 h-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardTabsSkeleton() {
  return (
    <div className="flex space-x-1 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-24 rounded-md" />
      ))}
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="ml-auto">
        <SkeletonButton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function InitiativeCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center gap-2">
              <SkeletonBadge />
              <SkeletonBadge />
            </div>
          </div>
          <Skeleton className="h-6 w-6" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SkeletonAvatar className="w-6 h-6" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InitiativeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <InitiativeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TaskListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3 rounded-lg border">
          <Skeleton className="w-3 h-3 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex items-center gap-1">
                <SkeletonAvatar className="w-4 h-4" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBadge className="h-5 w-16" />
            <SkeletonBadge className="h-5 w-12" />
            <Skeleton className="h-6 w-6" />
          </div>
        </div>
      ))}
    </div>
  );
}