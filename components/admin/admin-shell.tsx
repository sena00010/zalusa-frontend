"use client";

import React from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import { AdminSidebar } from "./admin-sidebar";
import { NotificationBell } from "./NotificationBell";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6FA]">
      <div className="flex">
        <AdminSidebar open={open} onClose={() => setOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header (Desktop) */}
          <header className="hidden md:flex h-16 shrink-0 items-center justify-between px-8 sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="text-sm font-semibold text-slate-500">Yönetim Paneli</div>
            <NotificationBell />
          </header>

          {/* Content */}
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
            {/* Mobile controls */}
            <div className="mb-6 flex items-center justify-between gap-3 md:hidden">
              <button
                className={cn(
                  "grid h-[42px] w-[42px] place-items-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all",
                )}
                onClick={() => setOpen(true)}
                aria-label="Menüyü aç"
              >
                <Menu className="h-5 w-5 text-slate-700" />
              </button>
              <div className="text-sm font-semibold text-slate-500">Admin Panel</div>
              <NotificationBell />
            </div>

            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
