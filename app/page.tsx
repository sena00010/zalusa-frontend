import { Suspense } from "react";

import { AuthPage } from "@/components/auth/auth-page";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="zalusa-animated-gradient border-b border-border/60 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500">
            <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
              <Skeleton className="h-4 w-72 bg-white/20" />
            </div>
          </div>
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-2 md:px-6 md:py-14">
            <Skeleton className="h-[520px] rounded-[32px]" />
            <Skeleton className="h-[520px] rounded-[var(--radius-lg)]" />
          </div>
        </div>
      }
    >
      <AuthPage />
    </Suspense>
  );
}
