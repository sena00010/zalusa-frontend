import type React from "react";

import { cn } from "@/lib/cn";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-[var(--radius-md)] bg-surface px-4 text-sm text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-brand-500/35",
        className,
      )}
      {...props}
    />
  );
}

