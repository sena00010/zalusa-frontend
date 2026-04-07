import type React from "react";

import { cn } from "@/lib/cn";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[110px] w-full resize-y rounded-2xl bg-surface px-4 py-3 text-sm text-foreground ring-1 ring-border placeholder:text-muted-2 focus:outline-none focus:ring-2 focus:ring-brand-500/35",
        className,
      )}
      {...props}
    />
  );
}

