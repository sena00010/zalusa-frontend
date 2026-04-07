"use client";

import { useEffect, useState } from "react";
import {
  Globe2,
  PackageCheck,
  PackageOpen,
  ReceiptText,
  Scale,
  Loader2,
} from "lucide-react";

import { KpiCard } from "@/components/panel/kpi-card";
import { PanelDataSection } from "./dashboard-client-section";
import {
  dashboardService,
  DashboardStats,
} from "@/lib/services/dashboardService";

// ─── Ülke Kodu → Türkçe Ad ───────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  DE: "Almanya",
  NL: "Hollanda",
  FR: "Fransa",
  GB: "İngiltere",
  US: "ABD",
  IT: "İtalya",
  ES: "İspanya",
  AT: "Avusturya",
  BE: "Belçika",
  CH: "İsviçre",
  SE: "İsveç",
  DK: "Danimarka",
  NO: "Norveç",
  PL: "Polonya",
  CZ: "Çekya",
  PT: "Portekiz",
  IE: "İrlanda",
  FI: "Finlandiya",
  GR: "Yunanistan",
  RO: "Romanya",
  BG: "Bulgaristan",
  HR: "Hırvatistan",
  HU: "Macaristan",
  SK: "Slovakya",
  SI: "Slovenya",
  LT: "Litvanya",
  LV: "Letonya",
  EE: "Estonya",
  JP: "Japonya",
  CN: "Çin",
  KR: "Güney Kore",
  AU: "Avustralya",
  CA: "Kanada",
  BR: "Brezilya",
  SA: "Suudi Arabistan",
  AE: "BAE",
  TR: "Türkiye",
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

// ─── Status Mapping ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  string,
  { label: string; className: string; dotClass: string }
> = {
  draft: {
    label: "TASLAK",
    className: "bg-slate-100 text-slate-600",
    dotClass: "bg-slate-400",
  },
  pending_payment: {
    label: "ÖDEME BEKLEYEN",
    className: "bg-orange-50 text-orange-600",
    dotClass: "bg-orange-500",
  },
  paid: {
    label: "ÖDENDİ",
    className: "bg-blue-50 text-blue-600",
    dotClass: "bg-blue-500",
  },
  processing: {
    label: "İŞLENİYOR",
    className: "bg-amber-50 text-amber-600",
    dotClass: "bg-amber-500",
  },
  shipped: {
    label: "YOLDA",
    className: "bg-sky-50 text-sky-600",
    dotClass: "bg-sky-500",
  },
  delivered: {
    label: "TESLİM EDİLDİ",
    className: "bg-[#ECFDF5] text-[#10B981]",
    dotClass: "bg-[#10B981]",
  },
  cancelled: {
    label: "İPTAL EDİLDİ",
    className: "bg-red-50 text-red-600",
    dotClass: "bg-red-500",
  },
};

function getStatus(status: string) {
  return (
    STATUS_MAP[status] ?? {
      label: status,
      className: "bg-slate-100 text-slate-600",
      dotClass: "bg-slate-400",
    }
  );
}

function StatusBadge({ status }: { status: string }) {
  const st = getStatus(status);
  return (
    <span
      className={`${st.className} px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide inline-flex items-center gap-1.5 whitespace-nowrap`}
    >
      <span
        className={`w-[6px] h-[6px] rounded-full ${st.dotClass || "bg-slate-400"}`}
      />
      {st.label}
    </span>
  );
}

// ─── Tarih Formatlama ─────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Sayfa Bileşeni ──────────────────────────────────────────────────────────

export default function PanelHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService
      .getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#94A3B8]" />
      </div>
    );
  }

  // ── Error ──
  if (error || !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-red-500">
          {error ?? "Veriler yüklenemedi."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#1E293B]">
          Dashboard
        </h1>
        <p className="text-[14px] text-[#64748B] font-medium">
          Panelinize hoş geldiniz. Hesap özetinizi ve istatistiklerinizi
          buradan inceleyebilirsiniz.
        </p>
      </div>

      {/* ── KPI Kartları ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Toplam Gönderi"
          value={stats.totalShipments}
          icon={PackageOpen}
          helper="Tüm zamanlar"
        />
        <KpiCard
          title="Toplam Harcama"
          value={`${stats.totalSpentTry.toLocaleString("tr-TR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })} ₺`}
          icon={ReceiptText}
          helper="Tüm zamanlar"
        />
        <KpiCard
          title="Ortalama Maliyet"
          value={`${stats.averageShipmentCostTry.toLocaleString("tr-TR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })} ₺`}
          icon={Scale}
          helper="Tahmini ortalama"
        />
        <KpiCard
          title="Teslim Edilenler"
          value={stats.deliveredShipments}
          icon={PackageCheck}
          helper="Tüm zamanlar"
        />
        <KpiCard
          title="Ülke Sayısı"
          value={stats.uniqueCountriesCount}
          icon={Globe2}
          helper="Gönderim yapılan"
        />
      </div>

      {/* ── Ülkeler + Son İşlemler ── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        {/* ── Gönderdiğim Ülkeler ── */}
        <div className="bg-white rounded-[20px] border border-[#E8EDF2] shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-[16px] font-bold tracking-tight text-[#1E293B]">
              Gönderdiğim Ülkeler
            </h2>
          </div>
          <div className="px-6 pb-6">
            {stats.topCountries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Globe2 className="h-10 w-10 text-[#CBD5E1] mb-3" />
                <p className="text-[14px] font-bold text-[#64748B]">
                  Ülke bulunamadı
                </p>
                <p className="text-[13px] text-[#94A3B8] mt-1">
                  Henüz hiç gönderi yapmadınız.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {stats.topCountries.map((c) => (
                  <div
                    key={c.countryCode}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 overflow-hidden items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E2E8F0]">
                        <img
                          src={`https://flagcdn.com/w80/${c.countryCode.toLowerCase()}.png`}
                          alt={getCountryName(c.countryCode)}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold text-[#1E293B]">
                          {getCountryName(c.countryCode)}
                        </div>
                        <div className="mt-0.5 text-[12px] font-semibold text-[#94A3B8]">
                          Kod: {c.countryCode}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[13px] font-bold text-[#64748B] bg-[#F1F5F9] px-3.5 py-1.5 rounded-full">
                      {c.count} Gönderi
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Son İşlemler ── */}
        <div className="bg-white rounded-[20px] border border-[#E8EDF2] shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-[16px] font-bold tracking-tight text-[#1E293B]">
              Son İşlemler
            </h2>
          </div>
          <div className="px-6 pb-6">
            {stats.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PackageOpen className="h-10 w-10 text-[#CBD5E1] mb-3" />
                <p className="text-[14px] font-bold text-[#64748B]">
                  İşlem bulunamadı
                </p>
                <p className="text-[13px] text-[#94A3B8] mt-1">
                  Son işlemleriniz burada listelenecek.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    {/* Left: icon + info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#18181B]">
                        <PackageOpen className="h-[18px] w-[18px] text-white" />
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-[20px] w-[20px] overflow-hidden items-center justify-center rounded-full bg-white shadow ring-2 ring-white">
                          <img
                            src={`https://flagcdn.com/w40/${order.countryCode.toLowerCase()}.png`}
                            alt={getCountryName(order.countryCode)}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-bold text-[#1E293B]">
                          {getCountryName(order.countryCode)} Gönderisi
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#94A3B8]">
                          <span className="bg-[#EEF2FF] text-[#4F46E5] px-2 py-[2px] rounded-[4px] font-mono text-[11px] tracking-wide">
                            {order.trackingCode ||
                              `ZLS-SHP-${order.id}`}
                          </span>
                          <span>•</span>
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: price + status */}
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Tutar
                        </div>
                        <div className="text-[15px] font-extrabold text-[#1E293B] mt-0.5">
                          {order.priceTry.toLocaleString("tr-TR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          ₺
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <PanelDataSection />
      </div>
    </div>
  );
}