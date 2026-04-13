import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function TaskDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
      {/* Back button */}
      <Skeleton className="h-8 w-20" />

      <div className="space-y-6">
        {/* Metadata row */}
        <div className="flex gap-4">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <div className="h-4 w-px bg-muted" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>

        {/* Title */}
        <Skeleton className="h-12 w-3/4" />

        {/* Info rows */}
        <div className="space-y-4">
          <div className="flex gap-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex gap-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-36" />
          </div>
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      <Separator />

      {/* Description */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex gap-6">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
