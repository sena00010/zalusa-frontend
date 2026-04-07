"use client";

import React from "react";

import { Menu } from "lucide-react";

import { cn } from "@/lib/cn";
import { Sidebar } from "./sidebar";
import { HelpSidebar } from "./help-sidebar";

export function PanelShell({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex">
        <Sidebar open={open} onClose={() => setOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header (Desktop) */}
          <header className="hidden md:flex h-20 shrink-0 items-center justify-between px-8 sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] transition-all">
            <div className="flex-1"></div> {/* Left spacer if needed */}
            <div className="flex items-center gap-4">
              {right}
            </div>
          </header>

          {/* Content */}
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 md:px-10 md:py-10">
            {/* Minimal mobile controls (no full header) */}
            <div className="mb-6 flex items-center justify-between gap-3 md:hidden">
              <button
                className={cn(
                  "grid h-[42px] w-[42px] place-items-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all",
                )}
                onClick={() => setOpen(true)}
                aria-label="Menüyü aç"
              >
                <Menu className="h-5 w-5 text-slate-700" />
              </button>
              
              <div className="flex items-center gap-3">
                {right ? <div className="shrink-0">{right}</div> : null}
              </div>
            </div>
            
            <div className="w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* Help Sidebar component */}
      <HelpSidebar />
    </div>
  );
}

