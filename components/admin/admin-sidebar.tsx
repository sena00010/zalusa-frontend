"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Building2,
  DollarSign,
  Users,
  UsersRound,
  UserCog,
  LogOut,
  X,
  Tag,
  HelpCircle,
  Headphones,
  Calculator,
  Crown,
  TicketCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/kurye-talepleri", label: "Kurye Talepleri", icon: Truck },
  { href: "/admin/canli-destek", label: "Canlı Destek", icon: Headphones },
  { href: "/admin/destek-talepleri", label: "Destek Talepleri", icon: TicketCheck },
  { href: "/admin/kargo-sirketleri", label: "Kargo Şirketleri", icon: Building2 },
  { href: "/admin/doviz-kurlari", label: "Döviz Kurları", icon: DollarSign },
  { href: "/admin/margin-rules", label: "Fiyat & Marj Kuralları", icon: Calculator },
  { href: "/admin/gonderi-aciklama-tipleri", label: "Gönderi Açıklama Tipleri", icon: Tag },
  { href: "/admin/yardim-ogeleri", label: "Yardım Öğeleri", icon: HelpCircle },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: UsersRound },
  { href: "/admin/bayiler", label: "Bayiler", icon: Crown },
  { href: "/admin/admin-yonetimi", label: "Admin Yönetimi", icon: Users },
  { href: "/admin/profil", label: "Profil", icon: UserCog },
];

function AdminSidebarLink({
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
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2 rounded-2xl px-4 py-1 text-[15px] font-semibold transition-all duration-200",
        active
          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          active ? "bg-white/15" : "bg-transparent group-hover:bg-white",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            active ? "text-white" : "text-indigo-600",
          )}
        />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("zalusa.admin.token");
    router.push("/admin/login");
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Brand — sabit üst */}
      <div className="px-7 pt-8 shrink-0">
        <Link href="/admin" className="group flex items-center gap-2" onClick={onNavigate}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
            <Image src="/logo-ikon.png" alt="Zalusa" width={26} height={26} />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold text-slate-900">Zalusa</div>
            <div className="text-sm font-semibold text-indigo-500">Admin Panel</div>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mt-6 px-7 shrink-0">
        <div className="h-px w-full bg-slate-100" />
      </div>

      {/* Nav — scroll edilebilir */}
      <nav className="mt-5 flex-1 min-h-0 overflow-y-auto space-y-1.5 px-5 pb-2">
        {adminNavItems.map((item) => (
          <AdminSidebarLink key={item.href} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Logout — sabit alt */}
      <div className="px-5 py-4 shrink-0 border-t border-slate-100 bg-white">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-2xl px-4 py-1 text-[15px] font-semibold text-red-500 transition-all duration-200 hover:bg-red-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <LogOut className="h-5 w-5" />
          </span>
          <span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden h-screen w-[280px] shrink-0 bg-white md:block sticky top-0 border-r border-slate-100">
        <AdminSidebarContent />
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
            "absolute left-0 top-0 h-full w-[82vw] max-w-[280px] bg-white shadow-2xl transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          aria-hidden={!open}
        >
          <div className="absolute right-3 top-4 z-10">
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              aria-label="Menüyü kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <AdminSidebarContent onNavigate={onClose} />
        </aside>
      </div>
    </>
  );
}
