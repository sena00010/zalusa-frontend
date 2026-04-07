import type React from "react";

import { cn } from "@/lib/cn";

export function KpiCard({
  title,
  value,
  icon: Icon,
  helper,
  className,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  helper?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-[20px] border border-[#E8EDF2] px-5 py-5 flex items-center gap-4 transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      {/* Circular dark icon */}
      <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-[#18181B] text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)]">
        <Icon className="h-[22px] w-[22px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-[#94A3B8] leading-none">
          {title}
        </div>
        <div className="mt-1.5 truncate text-[22px] font-extrabold tracking-tight text-[#0F172A] leading-tight">
          {value}
        </div>
        {helper ? (
          <div className="mt-1 text-[10px] font-bold tracking-[0.08em] text-[#CBD5E1] uppercase">
            {helper}
          </div>
        ) : null}
      </div>
    </div>
  );
}
