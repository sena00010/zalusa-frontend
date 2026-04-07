"use client";

import React from "react";
import {
  Wallet,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  RefreshCcw,
  Percent,
  Users,
  Ticket,
  Hash,
  Infinity,
} from "lucide-react";
import {
  resellerService,
  type ResellerDashboardData,
  type AdminCouponInfo,
} from "@/lib/services/resellerService";

// ─── Yardımcı: Tarih formatlama ──────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(val: number): string {
  return val.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// Bayi Dashboard Sayfası
// ═════════════════════════════════════════════════════════════════════════════

export default function ResellerDashboardPage() {
  const [data, setData] = React.useState<ResellerDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resellerService.getDashboard();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Veri alınamadı");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Loading skeleton ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Bayi Paneli</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Bayi Paneli</h1>
        <div className="rounded-2xl bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const wallet = data?.wallet ?? { balance: 0, totalEarned: 0 };
  const transactions = data?.transactions ?? [];
  const commissionRate = data?.commissionRate ?? 0;
  const discountAllowance = data?.discountAllowance ?? 0;
  const customerCount = data?.customerCount ?? 0;
  const adminCoupons = data?.adminCoupons ?? [];

  // ── Stat kartları ────────────────────────────────────────────────────
  const statCards = [
    {
      label: "Mevcut Bakiye",
      value: `${formatCurrency(wallet.balance)} ₺`,
      icon: Wallet,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      ringColor: "ring-emerald-100",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Toplam Kazanç",
      value: `${formatCurrency(wallet.totalEarned)} ₺`,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      ringColor: "ring-indigo-100",
      gradient: "from-indigo-500 to-purple-600",
    },
    {
      label: "Komisyon Oranı",
      value: `%${commissionRate}`,
      subtitle: discountAllowance > 0 ? `Müşteri indirimi: %${discountAllowance}` : undefined,
      icon: Percent,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      ringColor: "ring-amber-100",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      label: "Toplam Müşteri",
      value: customerCount.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      ringColor: "ring-blue-100",
      gradient: "from-blue-500 to-cyan-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bayi Paneli</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cüzdan bakiyeniz, komisyon oranınız ve işlem geçmişiniz
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
        >
          <RefreshCcw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      {/* ── Bilgi Kartları ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ${card.ringColor} shadow-sm transition hover:shadow-md`}
          >
            <div
              className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${card.gradient} opacity-10`}
            />
            <div className="relative flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgColor}`}
              >
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  {card.value}
                </div>
                <div className="text-xs font-medium text-slate-500">
                  {card.label}
                </div>
                {"subtitle" in card && card.subtitle && (
                  <div className="text-[10px] font-medium text-slate-400">
                    {card.subtitle}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Admin Kuponlarım ─────────────────────────────────────────────── */}
      {adminCoupons.length > 0 && (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <Ticket className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Size Tanımlanan Kuponlar
              </h2>
              <p className="text-xs text-slate-500">
                Admin tarafından bayinize tanımlanan indirim kuponları
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Kupon Kodu
                  </th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    İndirim
                  </th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Kullanım
                  </th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Son Kullanma
                  </th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody>
                {adminCoupons.map((coupon: AdminCouponInfo) => {
                  const isExpired =
                    coupon.expiresAt &&
                    new Date(coupon.expiresAt) < new Date();
                  const limitReached =
                    coupon.usageLimit > 0 &&
                    coupon.usedCount >= coupon.usageLimit;
                  const isActiveReal = coupon.isActive && !isExpired && !limitReached;

                  return (
                    <tr
                      key={coupon.id}
                      className="border-b border-slate-50 transition hover:bg-purple-50/30"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 font-mono text-xs font-bold text-purple-700">
                          <Hash className="h-3 w-3" />
                          {coupon.code}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-sm font-semibold text-slate-900">
                          %{coupon.discountPct}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-sm text-slate-600">
                          {coupon.usedCount}
                          {coupon.usageLimit > 0
                            ? ` / ${coupon.usageLimit}`
                            : " / ∞"}
                        </span>
                        {limitReached && (
                          <span className="ml-1.5 text-xs text-red-500">
                            (Limit)
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {coupon.expiresAt ? (
                          <span
                            className={`text-xs ${
                              isExpired
                                ? "font-medium text-red-500"
                                : "text-slate-600"
                            }`}
                          >
                            {formatDateShort(coupon.expiresAt)}
                            {isExpired && " (Süresi dolmuş)"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Infinity className="h-3 w-3" />
                            Süresiz
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isActiveReal
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActiveReal
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {isActiveReal ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Son Cüzdan İşlemleri Tablosu ───────────────────────────────── */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Son Cüzdan İşlemleri
          </h2>
          <span className="text-xs font-medium text-slate-400">
            Son {transactions.length} işlem
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-400">
              Henüz işlem geçmişi bulunmuyor
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tarih
                  </th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    İşlem Tipi
                  </th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tutar
                  </th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Açıklama
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const isEarning = t.type === "earning";
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-slate-50 transition hover:bg-slate-50/60"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isEarning
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {isEarning ? (
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownCircle className="h-3.5 w-3.5" />
                          )}
                          {isEarning ? "Kazanç" : "Ödeme Alındı"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`text-sm font-bold ${
                            isEarning ? "text-emerald-600" : "text-blue-600"
                          }`}
                        >
                          {isEarning ? "+" : "−"}
                          {formatCurrency(t.amount)} ₺
                        </span>
                      </td>
                      <td className="max-w-[280px] truncate px-4 py-3 text-sm text-slate-500">
                        {t.description || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
