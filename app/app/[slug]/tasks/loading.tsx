import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-16 mt-1" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Status groups */}
      <div className="space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 px-3 py-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            <div className="ml-4 border-l">
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center gap-3 px-4 py-2.5 ml-2"
                >
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-16 font-mono" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
