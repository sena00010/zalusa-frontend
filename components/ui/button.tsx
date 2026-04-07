import type React from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-9 px-4 text-xs font-bold",
        size === "md" && "px-6 py-2.5 text-sm font-extrabold",
        size === "lg" && "h-12 px-8 text-base font-extrabold",
        variant === "primary" &&
          "bg-lime-400 text-slate-900 shadow-sm shadow-lime-400/30 hover:bg-lime-300",
        variant === "secondary" &&
          "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 shadow-sm",
        variant === "ghost" &&
          "bg-transparent text-foreground hover:bg-brand-50/70 dark:hover:bg-white/5",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-500 shadow-sm hover:shadow-red-600/30",
        className,
      )}
      {...props}
    />
  );
}

