import type React from "react";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function Checkbox({
  checked,
  onChange,
  className,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  label: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md ring-1 transition-colors",
          checked
            ? "bg-brand-600 text-white ring-brand-600"
            : "bg-surface text-transparent ring-border hover:bg-surface-2",
        )}
      >
        <Check className="h-4 w-4" />
      </button>
      <span
        className="select-none text-sm leading-6 text-muted"
        onClick={() => onChange(!checked)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onChange(!checked);
        }}
      >
        {label}
      </span>
    </div>
  );
}

