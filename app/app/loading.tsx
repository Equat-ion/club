import { Skeleton } from "@/components/ui/skeleton";

export default function OrgSwitcherLoading() {
  return (
    <div className="w-full flex h-screen overflow-hidden items-center justify-center p-4 md:p-8 bg-[url('/org_bg.svg')] bg-cover bg-center bg-fixed antialiased">
      <div className="absolute inset-0 bg-white/70 pointer-events-none" />
      <div
        className="relative max-w-6xl w-full bg-background/90 border-2 border-border flex flex-col md:flex-row overflow-hidden shadow-2xl"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        {/* Left Column */}
        <div className="w-full md:w-5/12 p-8 md:p-16 flex flex-col border-b md:border-b-0 md:border-r border-border bg-card/20">
          {/* Branding */}
          <div className="flex items-center gap-3 mb-16">
            <Skeleton className="size-10 rounded-none" />
            <Skeleton className="h-5 w-36" />
          </div>

          {/* Heading + subtitle */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-14 w-48" />
              <Skeleton className="h-14 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-full max-w-md" />
              <Skeleton className="h-5 w-3/4 max-w-sm" />
            </div>
          </div>

          {/* Create org button */}
          <div className="mt-16">
            <Skeleton className="h-14 w-full max-w-xs" />
          </div>

          <div className="flex-1" />

          {/* Account info */}
          <div className="pt-12 flex items-center gap-3">
            <Skeleton className="size-10 rounded-none shrink-0" />
            <div className="hidden sm:block space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="ml-auto size-8 rounded-none shrink-0" />
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full md:w-7/12 flex flex-col overflow-hidden bg-background/60">
          {/* Header */}
          <div className="px-8 md:px-16 pt-8 md:pt-16 pb-6 shrink-0">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-7 w-20" />
            </div>
          </div>

          {/* Org grid */}
          <div className="flex-1 min-h-0 px-8 md:px-16 pb-4 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 border border-border bg-muted/30"
                >
                  <Skeleton className="size-12 rounded-none shrink-0" />
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="size-4 rounded-none ml-auto shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 md:px-16 py-8 shrink-0 border-t border-border flex flex-col xl:flex-row items-center justify-between gap-6">
            <Skeleton className="h-3 w-48" />
            <div className="flex gap-6">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
