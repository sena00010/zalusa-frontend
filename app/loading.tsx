import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
          <Skeleton className="h-4 w-72 bg-white/20" />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2 md:items-center md:px-6 md:py-16">
        <div className="space-y-4">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-12 w-full max-w-[520px]" />
          <Skeleton className="h-12 w-full max-w-[440px]" />
          <Skeleton className="h-5 w-full max-w-[560px]" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-44 rounded-full" />
            <Skeleton className="h-12 w-40 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-[420px] rounded-[32px]" />
      </div>
    </div>
  );
}

