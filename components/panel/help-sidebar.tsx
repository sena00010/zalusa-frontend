"use client";

import React, { useEffect, useState } from "react";
import {
  MessageCircle,
  Search,
  Home,
  Megaphone,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Package,
  Landmark,
  Truck,
  Wallet,
  FileText,
  HelpCircle,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ─── Icon Mapping ─────────────────────────────────────────────────────────────
// Backend'den gelen icon string'ini gerçek Lucide component'ine çevirir
const iconMap: Record<string, LucideIcon> = {
  Package,
  Landmark,
  Truck,
  Wallet,
  FileText,
  HelpCircle,
  MessageCircle,
  Megaphone,
  Sparkles,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] || HelpCircle;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface HelpItemAPI {
  id: number;
  title: string;
  description: string;
  icon: string;
  badge: string | null;
  external: boolean;
  link: string | null;
  sortOrder: number;
  isActive: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function HelpSidebar() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HelpItemAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Panel açıldığında verileri çek
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch(`${API_BASE}/api/help-items`)
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
      .then((data: HelpItemAPI[]) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Arama filtresi
  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Floating Help Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center gap-2 py-3 px-2 rounded-l-2xl shadow-[0_4px_24px_rgba(45,91,255,0.35)] transition-all duration-300 hover:shadow-[0_4px_32px_rgba(45,91,255,0.5)] hover:px-3 group"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            background: "linear-gradient(180deg, #3d6bff 0%, #2247e6 100%)",
          }}
        >
          <div className="flex items-center gap-2 rotate-180 text-white">
            <Sparkles className="h-4 w-4 mb-1 opacity-80" />
            <span className="text-[14px] font-semibold tracking-wide">
              Yardım
            </span>
          </div>
        </button>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-over Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 w-[400px] max-w-[90vw] bg-white z-50 shadow-[-8px_0_40px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header — gradient */}
        <div
          className="relative px-6 pt-6 pb-8"
          style={{
            background:
              "linear-gradient(135deg, #3d6bff 0%, #2247e6 60%, #152b8a 100%)",
          }}
        >
          {/* decorative shapes */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-16 -bottom-8 h-32 w-32 rounded-full bg-white/[0.07]" />

          <button
            onClick={() => setOpen(false)}
            className="absolute top-5 right-5 h-8 w-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <X className="h-4 w-4 text-white" />
          </button>

          <div className="relative">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Merhaba{" "}
                  <span className="inline-block animate-[wave_1.8s_ease-in-out_infinite]">
                    👋
                  </span>
                </h2>
                <p className="text-[13px] text-blue-100 font-medium">
                  Yardıma ihtiyacın varsa buradayız!
                </p>
              </div>
            </div>

            <div className="relative mt-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Neye ihtiyacın var?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white text-[14px] text-slate-700 placeholder:text-slate-400 shadow-sm outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-blue-300 transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 space-y-2.5">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">
                Veriler yüklenemedi.
              </p>
              <button
                onClick={() => {
                  setOpen(false);
                  setTimeout(() => setOpen(true), 100);
                }}
                className="mt-2 text-sm text-blue-600 font-medium hover:underline"
              >
                Tekrar dene
              </button>
            </div>
          )}

          {/* Empty after search */}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">
                {searchTerm
                  ? "Aramanızla eşleşen sonuç bulunamadı."
                  : "Henüz yardım öğesi eklenmemiş."}
              </p>
            </div>
          )}

          {/* Items */}
          {!loading &&
            !error &&
            filtered.map((item) => {
              const Icon = getIcon(item.icon);
              return (
                <a
                  key={item.id}
                  href={item.link || "#"}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className="group flex items-start gap-3.5 rounded-2xl bg-white border border-slate-100 p-4 hover:border-blue-200 hover:shadow-[0_4px_20px_rgba(45,91,255,0.08)] transition-all duration-200"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[14px] text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {item.title}
                      </h3>
                      {item.badge && (
                        <span className="shrink-0 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-slate-500 leading-relaxed font-medium line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="shrink-0 mt-0.5">
                    {item.external ? (
                      <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </a>
              );
            })}
        </div>

        {/* Bottom Nav */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
          <button className="flex-1 flex flex-col items-center justify-center gap-0.5 text-blue-600">
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Ana Sayfa</span>
          </button>
          <button className="flex-1 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-slate-600 transition-colors relative">
            <Megaphone className="h-5 w-5" />
            <span className="text-[10px] font-medium">Duyurular</span>
            <span className="absolute top-2 right-[3.5rem] h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
        </div>
      </div>
    </>
  );
}