"use client";

import React from "react";
import {
  Package, Plus, Trash2, Search, Loader2,
  ArrowRight, MapPin, Scale, Star, Zap,
  Clock, Info, AlertTriangle, Calculator, PackageOpen,
  ReceiptText
} from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/cn";
import { shipmentService, type ApiCarrierQuote } from "@/lib/services/shipmentService";

// ── Paket satırı tipi ──
interface PkgRow {
  id: string;
  weightKg: string;
  widthCm: string;
  lengthCm: string;
  heightCm: string;
}

const emptyPkg = (): PkgRow => ({
  id: crypto.randomUUID(),
  weightKg: "",
  widthCm: "",
  lengthCm: "",
  heightCm: "",
});

function calcVolumetric(w: number, l: number, h: number) {
  return (w * l * h) / 5000;
}
function toNum(v: string) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

export default function FiyatHesaplamaPage() {
  const [countries, setCountries] = React.useState<any[]>([]);
  const [senderCountry, setSenderCountry] = React.useState("TR");
  const [receiverCountry, setReceiverCountry] = React.useState("");
  const [packages, setPackages] = React.useState<PkgRow[]>([emptyPkg()]);
  const [loading, setLoading] = React.useState(false);
  const [quotes, setQuotes] = React.useState<ApiCarrierQuote[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [calculated, setCalculated] = React.useState(false);

  // ── Ülkeleri çek ──
  React.useEffect(() => {
    const trNames = new Intl.DisplayNames(["tr"], { type: "region" });
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${API_BASE}/api/countries`)
      .then(r => r.json())
      .then((data: { isoCode: string; phoneCode?: string; countryName: string }[]) => {
        if (!Array.isArray(data)) return;
        const mapped = data.map((c) => {
          const code = c.isoCode.toUpperCase();
          let trName = c.countryName;
          try { trName = trNames.of(code) || c.countryName; } catch {}
          const isUS = code === "US" || code === "ABD";
          const flagUrl = isUS ? "/us-flag.png" : `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
          return {
            value: code,
            name: trName,
            flag: flagUrl,
            searchableText: `${trName} ${code}`,
            label: (
              <div className="flex items-center gap-2">
                <div className="shrink-0 overflow-hidden ring-1 ring-border shadow-sm h-5 w-7 relative flex items-center justify-center bg-muted/10 rounded-sm">
                  <img src={flagUrl} alt={code} className="w-full h-full object-cover" />
                </div>
                <span>{trName}</span>
              </div>
            ),
          };
        });
        setCountries(mapped);
      })
      .catch(console.error);
  }, []);

  function updatePkg(id: string, field: keyof PkgRow, val: string) {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  }
  function addPkg() { setPackages(prev => [...prev, emptyPkg()]); }
  function removePkg(id: string) { setPackages(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev); }

  const totalWeight = packages.reduce((s, p) => s + toNum(p.weightKg), 0);
  const totalVolumetric = packages.reduce((s, p) => s + calcVolumetric(toNum(p.widthCm), toNum(p.lengthCm), toNum(p.heightCm)), 0);
  const chargeableWeight = Math.max(totalWeight, totalVolumetric);

  async function handleCalculate() {
    setErrorMsg(null);
    if (!senderCountry || !receiverCountry) { setErrorMsg("Gönderen ve alıcı ülkesini seçiniz."); return; }
    const apiPkgs = packages.map(p => ({
      widthCm: toNum(p.widthCm) || 1, lengthCm: toNum(p.lengthCm) || 1,
      heightCm: toNum(p.heightCm) || 1, weightKg: toNum(p.weightKg) || 0.5, packageCount: 1,
    }));
    if (apiPkgs.some(pk => pk.weightKg <= 0)) { setErrorMsg("Tüm paketlerin ağırlığını giriniz."); return; }
    setLoading(true); setQuotes([]); setCalculated(false);
    try {
      const res = await shipmentService.getQuotes({ senderCountry, receiverCountry, packages: apiPkgs, shipmentType: "Paket" });
      setQuotes(res.quotes ?? []);
      setCalculated(true);
      if ((res.quotes ?? []).length === 0) setErrorMsg(res.message || "Bu rota için kargo firması bulunamadı.");
    } catch (err: any) {
      setErrorMsg(err?.message || "Fiyat bilgileri alınamadı.");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#1E293B]">Fiyat Hesaplama</h1>
          <p className="text-[13px] text-[#64748B] font-medium mt-0.5">Rota ve paket bilgilerinizi girin, anında kargo fiyatlarını karşılaştırın.</p>
        </div>
      </div>

      {/* ── Ana Grid: Sol (Rota + KPI + Paketler) / Sağ (Hesapla) ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Sol taraf */}
        <div className="space-y-5">
          {/* Rota */}
          <div className="bg-white rounded-[18px] border border-[#E8EDF2] shadow-sm">
            <div className="px-5 pt-4 pb-1.5 flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#18181B] text-white">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-[15px] font-bold tracking-tight text-[#1E293B]">Rota</h2>
            </div>
            <div className="px-5 pb-4 pt-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#94A3B8] mb-1 block uppercase tracking-wider">Nereden</label>
                  <SearchableSelect options={countries} value={senderCountry} onChange={(v) => setSenderCountry(v)} placeholder="Ülke seçiniz" className="h-10 rounded-xl text-[13px]" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#94A3B8] mb-1 block uppercase tracking-wider">Nereye</label>
                  <SearchableSelect options={countries} value={receiverCountry} onChange={(v) => setReceiverCountry(v)} placeholder="Ülke seçiniz" className="h-10 rounded-xl text-[13px]" />
                </div>
              </div>
            </div>
          </div>

          {/* KPI Özet — Rotanın altına taşındı, inline & compact */}
          <div className="grid gap-3 grid-cols-3">
            <div className="bg-white rounded-[14px] border border-[#E8EDF2] px-3.5 py-3 flex items-center gap-3 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#18181B] text-white shadow-sm">
                <Scale className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-[#94A3B8] leading-none uppercase tracking-wider">Brüt Ağırlık</div>
                <div className="mt-1 truncate text-[18px] font-extrabold tracking-tight text-[#0F172A] leading-tight">{totalWeight.toFixed(2)} <span className="text-[12px] font-bold text-[#94A3B8]">Kg</span></div>
              </div>
            </div>
            <div className="bg-white rounded-[14px] border border-[#E8EDF2] px-3.5 py-3 flex items-center gap-3 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#18181B] text-white shadow-sm">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-[#94A3B8] leading-none uppercase tracking-wider">Hacimsel</div>
                <div className="mt-1 truncate text-[18px] font-extrabold tracking-tight text-[#0F172A] leading-tight">{totalVolumetric.toFixed(2)} <span className="text-[12px] font-bold text-[#94A3B8]">Desi</span></div>
              </div>
            </div>
            <div className="bg-white rounded-[14px] border border-[#4F46E5]/15 px-3.5 py-3 flex items-center gap-3 transition-all hover:shadow-[0_2px_8px_rgba(79,70,229,0.06)]">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#4F46E5] text-white shadow-sm">
                <ReceiptText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-[#94A3B8] leading-none uppercase tracking-wider">Ücrete Esas</div>
                <div className="mt-1 truncate text-[18px] font-extrabold tracking-tight text-[#4F46E5] leading-tight">{chargeableWeight.toFixed(2)} <span className="text-[12px] font-bold text-[#4F46E5]/60">Kgs</span></div>
              </div>
            </div>
          </div>

          {/* Paketler */}
          <div className="bg-white rounded-[18px] border border-[#E8EDF2] shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#18181B] text-white">
                  <PackageOpen className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-[15px] font-bold tracking-tight text-[#1E293B]">Paketler</h2>
                <span className="text-[11px] font-bold text-[#CBD5E1] bg-[#F1F5F9] px-2 py-0.5 rounded-full">{packages.length} adet</span>
              </div>
              <button type="button" onClick={addPkg} className="flex items-center gap-1.5 rounded-full bg-[#18181B] px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#27272A] transition-colors shadow-sm">
                <Plus className="h-3 w-3" /> Paket Ekle
              </button>
            </div>
            <div className="px-5 pb-4 pt-2">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_32px] gap-2.5 mb-1.5">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Ağırlık (kg)</span>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-center col-span-3">Ölçüler — en × boy × yükseklik (cm)</span>
                <span />
              </div>

              <div className="space-y-2">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_32px] gap-2.5 items-end rounded-xl bg-[#F8FAFC] p-2.5 border border-[#E8EDF2]">
                    <div>
                      <label className="sm:hidden text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1 block">Ağırlık (kg)</label>
                      <div className="flex items-center h-9 rounded-lg bg-white border border-[#E2E8F0] px-2.5 focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-[#4F46E5]/10 transition-all">
                        <Scale className="h-3.5 w-3.5 text-[#94A3B8] mr-1.5 shrink-0" />
                        <input type="text" inputMode="decimal" value={pkg.weightKg} onChange={e => updatePkg(pkg.id, "weightKg", e.target.value)} placeholder="0.5" className="w-full bg-transparent text-[13px] font-bold text-[#0F172A] outline-none placeholder:text-[#CBD5E1]" />
                      </div>
                    </div>
                    <div>
                      <label className="sm:hidden text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1 block">En (cm)</label>
                      <input type="text" inputMode="decimal" value={pkg.widthCm} onChange={e => updatePkg(pkg.id, "widthCm", e.target.value)} placeholder="En" className="h-9 w-full rounded-lg bg-white border border-[#E2E8F0] px-2.5 text-[13px] font-bold text-[#0F172A] outline-none placeholder:text-[#CBD5E1] text-center focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all" />
                    </div>
                    <div>
                      <label className="sm:hidden text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1 block">Boy (cm)</label>
                      <input type="text" inputMode="decimal" value={pkg.lengthCm} onChange={e => updatePkg(pkg.id, "lengthCm", e.target.value)} placeholder="Boy" className="h-9 w-full rounded-lg bg-white border border-[#E2E8F0] px-2.5 text-[13px] font-bold text-[#0F172A] outline-none placeholder:text-[#CBD5E1] text-center focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all" />
                    </div>
                    <div>
                      <label className="sm:hidden text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1 block">Yükseklik (cm)</label>
                      <input type="text" inputMode="decimal" value={pkg.heightCm} onChange={e => updatePkg(pkg.id, "heightCm", e.target.value)} placeholder="Yük." className="h-9 w-full rounded-lg bg-white border border-[#E2E8F0] px-2.5 text-[13px] font-bold text-[#0F172A] outline-none placeholder:text-[#CBD5E1] text-center focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all" />
                    </div>
                    <div className="flex items-center justify-center">
                      {packages.length > 1 && (
                        <button type="button" onClick={() => removePkg(pkg.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sağ: Hesapla Butonu */}
        <div className="space-y-4">
          <div className="bg-white rounded-[18px] border border-[#E8EDF2] shadow-sm p-5 sticky top-24">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#18181B] text-white">
                <Calculator className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-[15px] font-bold tracking-tight text-[#1E293B]">Hesapla</h3>
            </div>

            {/* Bilgi kutusu */}
            <div className="flex items-start gap-2 rounded-xl bg-[#EEF2FF] px-3.5 py-2.5 mb-4">
              <Info className="h-3.5 w-3.5 text-[#4F46E5] shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-[#4F46E5] leading-relaxed">
                En yakın fiyatları görmek için paket bilgilerinizi eksiksiz giriniz.
              </p>
            </div>

            {/* Hata */}
            {errorMsg && !calculated && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 mb-3 text-[11px] font-medium text-red-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

            {/* Hesapla Butonu */}
            <button
              type="button"
              onClick={handleCalculate}
              disabled={loading}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-bold text-white transition-all",
                loading
                  ? "bg-[#94A3B8] cursor-not-allowed"
                  : "bg-[#18181B] hover:bg-[#27272A] shadow-[0_4px_14px_rgba(0,0,0,0.15)] active:scale-[0.98]"
              )}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Hesaplanıyor...</>
              ) : (
                <><Search className="h-4 w-4" />Fiyat Hesapla</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ SONUÇLAR ═══════════ */}
      {(calculated || (errorMsg && quotes.length === 0)) && (
        <div className="space-y-4">
          <h2 className="text-[18px] font-extrabold tracking-tight text-[#1E293B]">
            Taşıma Teklifleri
          </h2>

          {/* Uyarı */}
          <div className="flex items-start gap-2 rounded-xl bg-orange-50 px-4 py-2.5 border border-orange-200/60">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium text-orange-700 leading-relaxed">
              Gördüğünüz fiyatlar tahmini fiyatlardır. Gönderi oluştururken tüm detayları girdiğinizde ek ücretler ile karşılaşabilirsiniz.
            </p>
          </div>

          {/* Hata */}
          {errorMsg && quotes.length === 0 && (
            <div className="bg-white rounded-[18px] border border-[#E8EDF2] shadow-sm p-6 text-center">
              <PackageOpen className="h-8 w-8 text-[#CBD5E1] mx-auto mb-2" />
              <p className="text-[13px] font-bold text-[#64748B]">{errorMsg}</p>
            </div>
          )}

          {/* Teklif Listesi */}
          {quotes.length > 0 && (
            <div className="bg-white rounded-[18px] border border-[#E8EDF2] shadow-sm overflow-hidden">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-[#F8FAFC] border-b border-[#E8EDF2]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Taşıyıcı</span>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Hizmet Tipi</span>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-center">Tahmini Süre</span>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Tahmini Fiyat</span>
              </div>

              {/* Satırlar */}
              <div className="divide-y divide-[#F1F5F9]">
                {quotes.map((q, idx) => {
                  const isRecommended = q.tags?.includes("recommended");
                  const isCheapest = q.tags?.includes("cheapest");
                  return (
                    <div key={q.carrierId} className={cn(
                      "grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 sm:gap-4 items-center px-5 py-3 transition-colors hover:bg-[#F8FAFC]",
                      idx === 0 && "bg-[#FAFAFA]"
                    )}>
                      {/* Taşıyıcı */}
                      <div className="flex items-center gap-3">
                        {q.logoUrl ? (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[#E2E8F0] overflow-hidden shadow-sm">
                            <img src={q.logoUrl} alt={q.carrierName} className="h-6 w-6 object-contain" />
                          </div>
                        ) : (
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white text-[12px] font-bold" style={{ backgroundColor: q.logoColor || "#18181B" }}>
                            {q.logoLetter || q.carrierName.charAt(0)}
                          </div>
                        )}
                        <span className="text-[13px] font-bold text-[#1E293B]">{q.carrierName}</span>
                      </div>

                      {/* Hizmet */}
                      <div>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
                          q.serviceName?.toLowerCase().includes("express") || q.serviceName?.toLowerCase().includes("hızlı")
                            ? "bg-orange-50 text-orange-600"
                            : "bg-[#EEF2FF] text-[#4F46E5]"
                        )}>
                          {q.serviceName?.toLowerCase().includes("express") ? <Zap className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                          {q.serviceName || "Standart"}
                        </span>
                      </div>

                      {/* Süre */}
                      <div className="flex items-center sm:justify-center gap-1.5 text-[12px] font-semibold text-[#64748B]">
                        <Clock className="h-3 w-3 text-[#94A3B8]" />
                        <span>{q.deliveryLabel || `${q.minTransitDays}-${q.maxTransitDays} iş günü`}</span>
                      </div>

                      {/* Fiyat */}
                      <div className="flex flex-col items-end gap-0.5">
                        {(isRecommended || isCheapest) && (
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
                            isCheapest ? "bg-[#ECFDF5] text-[#10B981]" : "bg-orange-50 text-orange-600"
                          )}>
                            {isCheapest ? <Star className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5" />}
                            {isCheapest ? "En Uygun" : "Önerilen"}
                          </span>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] font-bold text-[#94A3B8]">{q.currency}</span>
                          <span className="text-[18px] font-extrabold text-[#0F172A] tracking-tight">{q.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Alt buton */}
              <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E8EDF2]">
                <a href="/panel/gonderi-olustur" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18181B] px-5 py-3 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:bg-[#27272A] transition-all active:scale-[0.98]">
                  Gönderi Oluştur
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
