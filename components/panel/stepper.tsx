"use client";

import React from "react";
import { Check, FileText, Ruler, LayoutGrid, MapPin, FileSpreadsheet, CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const STEP_IMAGES = [
  "/stepper/kargobilgilericon.png",
  "/stepper/paketölçüleri.png",
  "/stepper/fiyatlandırma.png",
  "/stepper/adressecimi.png",
  "/stepper/gümrüksecimi.png",
  "/stepper/tamamlandı.png",
];

export function Stepper({
  steps,
  current,
  onStepClick,
}: {
  steps: string[];
  current: number; // 0-based
  onStepClick?: (index: number) => void;
}) {
  return (
    <div className="flex items-center w-full overflow-x-auto pb-1 scrollbar-none">
      {steps.map((label, idx) => {
        const done = idx < current;
        const active = idx === current;
        const clickable = done && !!onStepClick;
        const stepImage = STEP_IMAGES[idx] || STEP_IMAGES[0];

        return (
          <React.Fragment key={label}>
            <button
              type="button"
              onClick={clickable ? () => onStepClick(idx) : undefined}
              disabled={!clickable && !active}
              className={cn(
                "flex items-center h-10 shrink-0 gap-2 rounded-[12px] p-[2px] pr-[8px] text-[13px] font-semibold whitespace-nowrap transition-all duration-200",
                active && "bg-[#18181B] text-white",
                done && "bg-[#EFFBF2] text-[#166534]",
                !active && !done && "bg-transparent text-[#94A3B8]",
                clickable && "cursor-pointer"
              )}
            >
              <div className="flex h-[36px] w-[36px] items-center justify-center shrink-0 rounded-[10px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02),0px_1px_3px_0px_rgba(0,0,0,0.08)]">
                {done ? (
                  <img src="/stepper/verified.png" alt="completed" className="h-[20px] w-[20px] object-contain" />
                ) : (
                  <img 
                    src={stepImage} 
                    alt={label} 
                    className={cn("h-[20px] w-[20px] object-contain", !active && "opacity-60 grayscale")} 
                  />
                )}
              </div>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {idx < steps.length - 1 && (
              <div className="hidden sm:block h-[2px] flex-1 min-w-[16px] bg-[#E2E8F0] shrink-0 rounded-full mx-2" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
