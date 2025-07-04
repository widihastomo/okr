import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton, SkeletonAvatar, SkeletonBadge, SkeletonButton, SkeletonTable } from "@/components/ui/skeleton";

export function ObjectiveDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-4 w-32" />
          </div>
          
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-96" />
              <div className="flex items-center gap-2">
                <SkeletonBadge />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex gap-2">
              <SkeletonButton />
              <SkeletonButton />
            </div>
          </div>
        </div>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <div className="flex items-center gap-2">
                  <SkeletonAvatar className="w-6 h-6" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex space-x-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-md" />
          ))}
        </div>

        {/* Tab Content */}
        <Card>
          <CardContent className="p-6">
            <SkeletonTable rows={5} cols={6} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function KeyResultDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-4 w-48" />
          </div>
          
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-80" />
              <div className="flex items-center gap-2">
                <SkeletonBadge />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex gap-2">
              <SkeletonButton />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Progress Overview */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="text-center space-y-2">
                        <Skeleton className="h-8 w-16 mx-auto" />
                        <Skeleton className="h-4 w-20 mx-auto" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-64 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <SkeletonTable rows={4} cols={3} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Progress History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2 p-3 border rounded">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityLogSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border rounded">
              <SkeletonAvatar className="w-8 h-8" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}