import React from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-2">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "h-11 w-full rounded-2xl bg-surface px-4 text-sm text-foreground ring-1 ring-border placeholder:text-muted-2 focus:outline-none focus:ring-2 focus:ring-brand-500/35",
            icon && "pl-11",
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
