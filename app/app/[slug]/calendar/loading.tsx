import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="w-full border-b px-4 py-4 lg:w-72 lg:border-b-0 lg:border-r">
          <Skeleton className="mb-3 h-8 w-full" />
          <Skeleton className="mb-6 h-56 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="grid grid-cols-7 gap-px border-b px-4 py-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-5 w-full" />
            ))}
          </div>

          <div className="grid flex-1 grid-cols-[56px_repeat(7,minmax(0,1fr))] gap-px px-4 py-2">
            <Skeleton className="h-full w-full" />
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-full w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
