import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <Skeleton className="h-[340px] rounded-[var(--radius-lg)]" />
    </div>
  );
}

