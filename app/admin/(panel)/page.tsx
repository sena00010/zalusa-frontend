"use client";

import React from "react";
import {
  Truck,
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { adminService } from "@/lib/services/adminService";

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<any>(null);
  const [carriers, setCarriers] = React.useState<any[]>([]);
  const [rates, setRates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const [s, c, r] = await Promise.all([
          adminService.getCourierStats().catch(() => null),
          adminService.listCarriers().catch(() => []),
          adminService.listExchangeRates().catch(() => []),
        ]);
        setStats(s);
        setCarriers(Array.isArray(c) ? c : []);
        setRates(Array.isArray(r) ? r : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards: StatCard[] = [
    {
      label: "Toplam Kurye Talebi",
      value: stats?.total ?? "—",
      icon: Truck,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      label: "Bekleyen Talepler",
      value: stats?.pending ?? "—",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Tamamlanan Talepler",
      value: stats?.completed ?? "—",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Aktif Kargo Şirketleri",
      value: carriers.filter((c) => c.isActive).length,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Genel sistem durumu ve istatistikler</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                <div className="text-xs font-medium text-slate-500">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Carriers preview */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Kargo Şirketleri</h2>
            <span className="text-xs font-medium text-slate-400">{carriers.length} şirket</span>
          </div>
          <div className="space-y-3">
            {carriers.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: c.logoColor || "#6366f1" }}
                  >
                    {c.logoLetter}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{c.carrierName}</div>
                    <div className="text-xs text-slate-500">{c.serviceName}</div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    c.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                  }`}
                >
                  {c.isActive ? "Aktif" : "Pasif"}
                </span>
              </div>
            ))}
            {carriers.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-400">Henüz kargo şirketi yok</div>
            )}
          </div>
        </div>

        {/* Exchange Rates */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Döviz Kurları</h2>
            <span className="text-xs font-medium text-slate-400">{rates.length} kur</span>
          </div>
          <div className="space-y-3">
            {rates.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {r.fromCurrency} → {r.toCurrency}
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900">{r.rate}</span>
              </div>
            ))}
            {rates.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-400">Henüz döviz kuru yok</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
