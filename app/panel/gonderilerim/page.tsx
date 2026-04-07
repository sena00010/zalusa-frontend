"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Package,
  Clock,
  CreditCard,
  Box,
  Search,
  ExternalLink,
  CalendarDays,
  MoreHorizontal,
  CheckCircle2,
  Truck,
  Plane,
  ArrowUpDown,
  Filter,
  Loader2,
  Copy,
  Crown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShipmentListItem, shipmentService } from "@/lib/services/shipmentService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
function getLogoSrc(url: string): string {
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_BASE}${url}`;
}

// ─── Ülke Kodu → Türkçe Ad ───────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  DE: "Almanya", NL: "Hollanda", FR: "Fransa", GB: "İngiltere", US: "ABD",
  IT: "İtalya", ES: "İspanya", AT: "Avusturya", BE: "Belçika", CH: "İsviçre",
  SE: "İsveç", DK: "Danimarka", NO: "Norveç", PL: "Polonya", CZ: "Çekya",
  PT: "Portekiz", IE: "İrlanda", FI: "Finlandiya", GR: "Yunanistan",
  RO: "Romanya", BG: "Bulgaristan", HR: "Hırvatistan", HU: "Macaristan",
  JP: "Japonya", CN: "Çin", KR: "Güney Kore", AU: "Avustralya", CA: "Kanada",
  BR: "Brezilya", SA: "Suudi Arabistan", AE: "BAE", TR: "Türkiye",
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code?.toUpperCase()] ?? code;
}

// ─── Status Mapping ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; className: string; dotClass: string }> = {
  draft: {
    label: "TASLAK",
    className: "bg-slate-100 text-slate-600",
    dotClass: "bg-slate-400",
  },
  pending_payment: {
    label: "ÖDEME BEKLİYOR",
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

function getCountryEmoji(countryCode: string) {
  if (!countryCode) return "🏳️";
  const code = countryCode.toUpperCase();
  // If it's longer than 2 characters, maybe it's not a standard ISO code. 
  // We'll just try to convert the first 2 letters.
  const codePoints = code
    .slice(0, 2)
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getStatus(status: string) {
  return STATUS_MAP[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
}

// ─── Tab → Backend status mapping ─────────────────────────────────────────────

const TABS = ["Tümü", "Taslak", "Ödeme Bekliyor", "Yolda", "Teslim Edildi"] as const;

const TAB_TO_STATUS: Record<string, string | undefined> = {
  "Tümü": undefined,
  "Taslak": "draft",
  "Ödeme Bekliyor": "pending_payment",
  "Yolda": "shipped",
  "Teslim Edildi": "delivered",
};

// ─── Custom Icons ─────────────────────────────────────────────────────────────

function WeightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v2" />
      <path d="M8 8a2 2 0 0 1 8 0v8a4 4 0 0 1-8 0V8z" />
      <path d="M8 8h8" />
    </svg>
  );
}

function MoneyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const st = getStatus(status);
  return (
    <span className={`${st.className} px-3 py-1 rounded-[8px] text-[11px] font-bold tracking-wide flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass || "bg-slate-400"}`}></span>
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Sayfa Bileşeni ──────────────────────────────────────────────────────────

export default function GonderilerimPage() {
  const [shipments, setShipments] = useState<ShipmentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Tümü");

  // ── Veri Çek ──
  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = TAB_TO_STATUS[activeTab];
      const res = await shipmentService.list({
        status: statusParam,
        page,
        limit,
      });
      setShipments(res.shipments);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message ?? "Gönderiler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Tab değişince sayfa 1'e dön
  function handleTabChange(tab: (typeof TABS)[number]) {
    setActiveTab(tab);
    setPage(1);
  }

  // ── Client-side arama filtresi ──
  const filtered = shipments.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const country = getCountryName(s.receiverCountry).toLowerCase();
    const code = s.receiverCountry.toLowerCase();
    const tracking = (s.trackingCode ?? "").toLowerCase();
    const carrier = (s.carrierName ?? "").toLowerCase();
    return (
      country.includes(q) ||
      code.includes(q) ||
      tracking.includes(q) ||
      carrier.includes(q)
    );
  });

  // ── Loading State ──
  if (loading && shipments.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error && shipments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="secondary" onClick={fetchShipments}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
          Gönderilerim
        </h1>
        <p className="text-[13px] text-slate-500">
          Tüm gönderilerinizi ve taslaklarınızı buradan yönetebilirsiniz.
        </p>
      </div>

      {/* ── Search & Filter Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-[2.5px]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Takip kodu, şehir veya kargo firması ara..."
            className="w-full pl-11 pr-4 rounded-[12px] h-[44px] border border-slate-200 bg-white text-[14px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700 placeholder:text-slate-400 font-medium"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 px-4 h-[44px] text-[13px] font-semibold rounded-[12px] bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            Sırala
          </button>
          <button className="flex items-center gap-2 px-4 h-[44px] text-[13px] font-semibold rounded-[12px] bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="h-4 w-4 text-slate-400" />
            Filtrele
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const counts: Record<string, number> = { "Tümü": 6, "Taslak": 3, "Ödeme Bekliyor": 1, "Yolda": 1, "Teslim Edildi": 1 };
          
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-semibold rounded-[10px] border transition-all ${
                isActive
                  ? "bg-white border-slate-200 text-slate-900 shadow-sm"
                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className={`flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-bold rounded-[6px] ${
                isActive ? "bg-slate-900 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-400 shadow-sm"
              }`}>
                {counts[tab] || 0}
              </span>
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── Loading overlay for tab/page changes ── */}
      {loading && shipments.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && filtered.length === 0 ? (
        <Card className="border-dashed rounded-[24px]">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Box className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Gönderi Bulunamadı</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm">
              {search
                ? "Arama kriterlerinize uygun bir gönderi bulunamadı."
                : "Henüz hiç gönderi oluşturmadınız."}
            </p>
            <Button
              className="mt-6 rounded-full"
              onClick={() => (window.location.href = "/panel/gonderi-olustur")}
            >
              Yeni Gönderi Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* ── Shipment Cards ── */
        <div className="grid gap-4">
          {filtered.map((s) => {
            const rawDate = new Date(s.createdAt || Date.now());
            const trMonth = rawDate.toLocaleString('tr-TR', { month: 'short' }).replace('.', '').toUpperCase();
            const cardDate = `${rawDate.getDate().toString().padStart(2, '0')} ${trMonth} ${rawDate.getFullYear()}`;

            const isDelivered = s.status === "delivered";

            return (
              <div
                key={s.id}
                className="bg-white rounded-[16px] border border-slate-200 p-5 transition-all hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col gap-5 relative"
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Origin -> Destination pipeline */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-[20px] sm:text-[24px] leading-none select-none">{getCountryEmoji(s.senderCountry)}</span>
                      <span className="text-[17px] sm:text-[18px] font-bold text-slate-900 tracking-tight">{s.senderCountry}</span>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center relative px-2 sm:px-4 min-w-[60px] max-w-[400px]">
                      <div className={`w-full border-t-[2px] border-dashed ${isDelivered ? "border-[#10B981]/40" : "border-slate-200"}`}></div>
                      <div className={`absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                        isDelivered ? "bg-[#10B981] shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" : "bg-slate-50"
                      }`}>
                        <Plane className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isDelivered ? "text-white" : "text-slate-400"}`} style={{ transform: "rotate(45deg)" }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[17px] sm:text-[18px] font-bold text-slate-900 tracking-tight">{s.receiverCountry}</span>
                      <span className="text-[20px] sm:text-[24px] leading-none select-none">{getCountryEmoji(s.receiverCountry)}</span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 xl:gap-6 mt-2 sm:mt-0 pl-0 sm:pl-4">
                    <div className="flex flex-col items-start xl:items-end">
                      <span className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">Toplam Ücret</span>
                      <span className="text-[18px] font-bold text-slate-900 tracking-tight mt-0.5">
                        {s.carrierCurrency === "TRY"
                          ? `${(s.carrierPriceTry ?? 0).toLocaleString("tr-TR")} ₺`
                          : `$${(s.carrierPrice ?? 0).toFixed(2)}`}
                      </span>
                      {s.discountAmountTry && s.discountAmountTry > 0 ? (
                        <div className="mt-1 flex items-center justify-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <Crown className="h-3 w-3" />
                          <span>{s.discountAmountTry.toLocaleString("tr-TR")} ₺ Bayi İndirimi Kazanıldı</span>
                        </div>
                      ) : null}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {s.status === "draft" ? (
                        <button
                          className="px-6 py-[10px] rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-bold transition-all shadow-sm"
                          onClick={() => window.location.href = `/panel/gonderi-olustur?draft=${s.id}`}
                        >
                          {/* bg-[#10B981] */}
                          Devam Et
                        </button>
                      ) : s.status === "pending_payment" ? (
                        <button
                          className="px-6 py-[10px] rounded-full bg-[#10B981] hover:bg-[#10B981] text-white text-[13px] font-bold transition-all shadow-sm"
                          onClick={() => window.location.href = `/panel/odeme/${s.id}`}
                        >
                          Ödeme Yap
                        </button>
                      ) : s.status === "shipped" ? (
                        <button
                          className="px-6 py-[10px] rounded-full bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-[13px] font-bold transition-all shadow-sm"
                          onClick={() => window.location.href = `/panel/takip/${s.trackingCode}`}
                        >
                          Kargo Takip
                        </button>
                      ) : (
                        <button
                          className="px-6 py-[10px] rounded-full bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-[13px] font-bold transition-all shadow-sm"
                          onClick={() => window.location.href = `/panel/gonderiler/${s.id}`}
                        >
                          Detaylar
                        </button>
                      )}
                      <button className="h-[40px] w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Divider Line */}
                <div className="h-px w-full bg-slate-100/70"></div>

                {/* Bottom Row */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    {/* Tracking Code */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-slate-50 border border-slate-100 text-[12px] font-bold text-slate-600 tracking-wide">
                      {s.trackingCode || `ZLS-SHP-${s.id}`}
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {/* Status */}
                    <StatusBadge status={s.status} />
                    {/* Type */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-slate-200 text-slate-600 text-[12px] font-semibold tracking-wide">
                      <Box className="h-3.5 w-3.5 text-slate-400" />
                      {s.shipmentType || "Paket"}
                    </div>
                    {/* Carrier */}
                    {s.carrierName && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white border border-slate-200 text-slate-700 text-[12px] font-bold tracking-wide">
                        {s.carrierLogoUrl ? (
                          <div className="w-[18px] h-[18px] rounded-[4px] overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                            <img src={getLogoSrc(s.carrierLogoUrl)} alt={s.carrierName} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-[18px] h-[18px] bg-[#3B2902] rounded-[4px] flex items-center justify-center shrink-0">
                            <Package className="h-2.5 w-2.5 text-amber-500" />
                          </div>
                        )}
                        {s.carrierName}{s.serviceName ? ` ${s.serviceName}` : ""}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-[12px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Tarih: <span className="font-bold text-slate-700">{cardDate}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <WeightIcon className="h-3.5 w-3.5" />
                      <span>Ağırlık: <span className="font-bold text-slate-700">{s.chargeableWeight ? s.chargeableWeight.toFixed(1) : "0.0"} kg</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Box className="h-3.5 w-3.5" />
                      <span>Koli: <span className="font-bold text-slate-700">{s.totalPackageCount || 1} adet</span></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Önceki
          </Button>
          <span className="text-sm text-slate-500 px-3">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sonraki
          </Button>
        </div>
      )}
    </div>
  );
}