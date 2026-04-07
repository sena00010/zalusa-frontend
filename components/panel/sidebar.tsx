"use client";

import React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronDown } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { panelNavItems, resellerNavItems } from "./nav-items";
import { profileService } from "@/lib/services/profileService";

/* ── Nav items grouped by category (matching Figma) ── */
const MENU_ITEMS = panelNavItems.filter(i =>
  ["/panel", "/panel/gonderi-olustur", "/panel/gonderilerim", "/panel/fiyat-hesaplama", "/panel/kurye-cagir"].includes(i.href)
);
const PERSONAL_ITEMS = panelNavItems.filter(i =>
  ["/panel/profilim", "/panel/fatura-odeme", "/panel/entegrasyon"].includes(i.href)
);
const BOTTOM_ITEMS = panelNavItems.filter(i =>
  ["/panel/destek-talebi", "/panel/cikis", "/panel/ayarlar"].includes(i.href)
);
const EXTRA_MENU = panelNavItems.filter(i => !MENU_ITEMS.includes(i) && !PERSONAL_ITEMS.includes(i) && !BOTTOM_ITEMS.includes(i));

function SidebarLink({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 w-full text-[14.5px] font-semibold transition-all duration-200",
        active
          ? "bg-[#F7F7F7] text-[#0F172A]"
          : "text-[#64748B] hover:bg-[#F7F7F7] hover:text-[#0F172A]",
      )}
    >
      <Icon className={cn("h-[20px] w-[20px] shrink-0", active ? "text-[#0F172A]" : "text-[#94A3B8] group-hover:text-[#64748B]")} />
      <span className="truncate pt-0.5">{label}</span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [name, setName] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<string>("customer");

  React.useEffect(() => {
    // Quick fallback from localStorage while API loads
    const cached = localStorage.getItem("zalusa.fullName");
    if (cached) setName(cached);

    // Role'ü localStorage'dan hızlı yükle (API yüklenene kadar)
    const cachedRole = localStorage.getItem("zalusa.role");
    if (cachedRole) setUserRole(cachedRole);

    const token = localStorage.getItem("zalusa.token");
    if (!token) return;

    let cancelled = false;
    // /api/auth/me endpoint'ini kullanarak kullanıcının role'ünü al
    const API = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${API}/api/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const full = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
        setName(full || data.email?.split("@")[0] || "Kullanıcı");
        setEmail(data.email ?? "");
        if (data.role) {
          setUserRole(data.role);
          localStorage.setItem("zalusa.role", data.role);
        }
      })
      .catch(() => {
        // Keep cached/fallback values on error
      });
    return () => { cancelled = true; };
  }, [pathname]);

  const initials = React.useMemo(() => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/" className="group flex items-center gap-2.5" onClick={onNavigate}>
          <div className="flex h-9 w-9 items-center justify-center">
            <Image src="/logo-ikon.png" alt="Zalusa" width={28} height={28} />
          </div>
          <div className="text-[20px] font-bold text-[#0F172A] tracking-tight pt-0.5">Zalusa</div>
        </Link>
      </div>

      {/* Menu section */}
      <div className="px-2.5">
        <div className="mb-2 px-3 text-[12px] font-bold uppercase tracking-widest text-[#94A3B8]">Menü</div>
        <nav className="space-y-0.5">
          {MENU_ITEMS.map((item) => (
            <SidebarLink key={item.href} {...item} onNavigate={onNavigate} />
          ))}
          {EXTRA_MENU.map((item) => (
            <SidebarLink key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>

      {/* Bayi (Reseller) section — sadece role='reseller' ise göster */}
      {userRole === "reseller" && (
        <div className="mt-4 px-2.5">
          <div className="mb-2 px-3 text-[12px] font-bold uppercase tracking-widest text-[#7C3AED]">Bayi</div>
          <nav className="space-y-0.5">
            {resellerNavItems.map((item) => (
              <SidebarLink key={item.href} {...item} onNavigate={onNavigate} />
            ))}
          </nav>
        </div>
      )}

      {/* Kişisel section */}
      <div className="mt-4 px-2.5">
        <div className="mb-2 px-3 text-[12px] font-bold uppercase tracking-widest text-[#94A3B8]">Kişisel</div>
        <nav className="space-y-0.5">
          {PERSONAL_ITEMS.map((item) => (
            <SidebarLink key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>

      {/* Bottom items */}
      <div className="px-2.5 mt-10 pt-2">
        <nav className="space-y-0.5">
          {BOTTOM_ITEMS.map((item) => (
            <SidebarLink key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>

      {/* User profile at bottom */}
      <div className="px-2.5 pb-10 mt-3">
        <div className="flex items-center justify-between rounded-[12px] ring-1 ring-[#E2E8F0] p-3 text-left hover:bg-[#F7F7F7] cursor-pointer transition-colors bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-[12px] font-bold text-[#0F172A] ring-1 ring-[#E2E8F0] shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-bold text-[#0F172A]">{name ?? "Yükleniyor..."}</div>
              <div className="truncate text-[12px] font-medium text-[#94A3B8]">{email}</div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8]" />
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden min-h-screen w-[260px] shrink-0 bg-white border-r border-[#E2E8F0] md:flex flex-col relative group">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 md:hidden", open ? "" : "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={onClose}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 h-[100dvh] w-[82vw] max-w-[260px] bg-white shadow-2xl transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          aria-hidden={!open}
        >
          <div className="absolute right-3 top-4 z-10">
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              aria-label="Menüyü kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SidebarContent onNavigate={onClose} />
        </aside>
      </div>
    </>
  );
}