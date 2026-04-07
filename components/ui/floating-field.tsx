import React from "react";
import { cn } from "@/lib/cn";

export function FloatingField({
  label,
  children,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <fieldset className={cn(
        "rounded-2xl border-[2px] px-3 pb-1 pt-0 transition-all",
        "focus-within:border-brand-500 focus-within:bg-brand-50/10 focus-within:shadow-sm",
        error ? "border-red-500" : "border-slate-200 bg-surface hover:border-slate-300"
      )}>
        <legend className={cn("px-2 text-[11px] font-bold tracking-wide uppercase", error ? "text-red-500" : "text-brand-700")}>{label}</legend>
        <div className="w-full">{children}</div>
      </fieldset>
      {error && <span className="text-xs font-semibold text-red-500">{error}</span>}
    </div>
  );
}
