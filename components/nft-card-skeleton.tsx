import { Card, CardContent } from "@/components/ui/card"

export function NFTCardSkeleton() {
  return (
    <Card className="origami-card animate-pulse">
      <CardContent className="p-0">
        {/* Image skeleton */}
        <div className="w-full aspect-square bg-muted/50 rounded-t-lg" />

        <div className="p-4 space-y-3">
          {/* Title and price skeleton */}
          <div className="flex justify-between items-start">
            <div className="h-4 bg-muted/50 rounded w-2/3" />
            <div className="h-5 bg-muted/50 rounded w-16 ml-2" />
          </div>

          {/* Creator skeleton */}
          <div className="h-3 bg-muted/50 rounded w-1/2" />

          {/* Stats skeleton */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <div className="h-3 bg-muted/50 rounded w-8" />
              <div className="h-3 bg-muted/50 rounded w-8" />
            </div>
            <div className="h-7 bg-muted/50 rounded w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function NFTGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <NFTCardSkeleton key={i} />
      ))}
    </div>
  )
}
