"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText, MapPin, Package, Ruler, BoxSelect, Star, Zap, BadgeDollarSign,
  Clock, Check, Info, Plane, Plus, Trash2, Search, User, Phone,
  MapPinned, Building, CheckCircle2, Tag, Receipt, ArrowRight,
  Save, Printer, PlusCircle, Sparkles, Loader2, RotateCcw, X,
  FileSpreadsheet, ArrowLeft, AlertTriangle, Box, Globe, ChevronUp,
  ChevronDown, Barcode, UploadCloud, Calendar, Scale, PlusSquare, ArrowRightSquare, ArrowLeftSquare,
  FileUp, CheckCircle, File as FileIcon
} from "lucide-react";
import { HSCodeCombobox } from "@/components/HSCodeCombobox";
import { Stepper } from "@/components/panel/stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/cn";
import { useAppState } from "@/hooks/useAppState";
import Image from "next/image";
import { ProformaItem, ShipmentDraft, PackageItem } from "@/lib/type";
import {
  shipmentService, addressService, measurementService, documentService,
  type ApiCarrierQuote, type ApiAddress, type ApiMeasurement, type ShipmentAttachment
} from "@/lib/services/shipmentService";
import { CitySelect } from "@/components/ui/city-select";
import { StateSelect } from "@/components/ui/state-select";
import ProformaExcelUploader, { ParsedProformaRow } from "@/components/Proformaexceluploader";
import PackageExcelUploader, { ParsedPackageRow } from "@/components/Packageexceluploader";

// NOT: @/lib/type içindeki ShipmentDraft tipinde "quantity" alanını
// "packageCount" olarak güncellemeyi unutma!

const STEPS = ["Kargo Bilgileri", "Paket Ölçüleri", "Fiyatlandırma", "Adres Seçimi", "Gümrük (Proforma) Beyanı", "Tamamlandı"] as const;

const EMPTY_PROFORMA_ITEM: ProformaItem = { id: "", productDescription: "", hsCode: "", sku: "", quantity: "1", unitPrice: "", origin: "TR" };
const EMPTY_PACKAGE_ITEM: PackageItem = { id: "", widthCm: "", lengthCm: "", heightCm: "", weightKg: "", packageCount: "1", selectedPreset: "", saveMeasurement: false, measurementLabel: "" };

const DEFAULT_DRAFT: ShipmentDraft = {
  shipmentName: "", referenceCode: "", shipmentType: "Paket", contentDescription: "",
  hasInsurance: false, note: "", senderCountry: "TR", receiverCountry: "", receiverPostalCode: "",
  packages: [{ ...EMPTY_PACKAGE_ITEM, id: crypto.randomUUID() }],
  selectedCarrierId: "", carrierQuotes: [],
  selectedSenderAddressId: "sender-1", selectedReceiverAddressId: "",
  senderName: "", senderCompany: "", senderPhone: "+90", senderAddress: "", senderCity: "", saveSenderAddress: false,
  receiverName: "", receiverCompany: "", receiverPhone: "", receiverAddress: "", receiverCity: "",
  receiverStateProvince: "", receiverAddressCountry: "", receiverAddressPostalCode: "",
  saveReceiverAddress: false,
  proformaDescription: "", proformaCurrency: "EUR", proformaIOSS: "",
  proformaItems: [{ ...EMPTY_PROFORMA_ITEM, id: crypto.randomUUID() }],
  proformaFileName: "",
};

const COUNTRY_CITIES: Record<string, { label: string; value: string }[]> = {
  DE: [{ label: "Berlin", value: "Berlin" }, { label: "Münih", value: "Münih" }, { label: "Hamburg", value: "Hamburg" }, { label: "Frankfurt", value: "Frankfurt" }, { label: "Köln", value: "Köln" }, { label: "Stuttgart", value: "Stuttgart" }, { label: "Düsseldorf", value: "Düsseldorf" }],
  NL: [{ label: "Amsterdam", value: "Amsterdam" }, { label: "Rotterdam", value: "Rotterdam" }, { label: "Den Haag", value: "Den Haag" }, { label: "Utrecht", value: "Utrecht" }, { label: "Eindhoven", value: "Eindhoven" }, { label: "Groningen", value: "Groningen" }],
  FR: [{ label: "Paris", value: "Paris" }, { label: "Lyon", value: "Lyon" }, { label: "Marsilya", value: "Marsilya" }, { label: "Nice", value: "Nice" }, { label: "Toulouse", value: "Toulouse" }, { label: "Bordeaux", value: "Bordeaux" }],
  GB: [{ label: "Londra", value: "Londra" }, { label: "Manchester", value: "Manchester" }, { label: "Birmingham", value: "Birmingham" }, { label: "Liverpool", value: "Liverpool" }, { label: "Edinburgh", value: "Edinburgh" }],
  US: [{ label: "New York", value: "New York" }, { label: "Los Angeles", value: "Los Angeles" }, { label: "Chicago", value: "Chicago" }, { label: "Houston", value: "Houston" }, { label: "Miami", value: "Miami" }, { label: "San Francisco", value: "San Francisco" }],
  IT: [{ label: "Roma", value: "Roma" }, { label: "Milano", value: "Milano" }, { label: "Napoli", value: "Napoli" }, { label: "Torino", value: "Torino" }, { label: "Floransa", value: "Floransa" }],
  ES: [{ label: "Madrid", value: "Madrid" }, { label: "Barcelona", value: "Barcelona" }, { label: "Sevilla", value: "Sevilla" }, { label: "Valencia", value: "Valencia" }],
  AT: [{ label: "Viyana", value: "Viyana" }, { label: "Salzburg", value: "Salzburg" }, { label: "Graz", value: "Graz" }, { label: "Innsbruck", value: "Innsbruck" }],
};

type MeasurementPreset = { label: string; value: string; widthCm: string; lengthCm: string; heightCm: string; weightKg: string };

const RECEIVER_COUNTRIES = [
  { label: "Almanya (DE)", value: "DE" }, { label: "Hollanda (NL)", value: "NL" },
  { label: "Fransa (FR)", value: "FR" }, { label: "İngiltere (GB)", value: "GB" },
  { label: "Amerika Birleşik Devletleri (US)", value: "US" }, { label: "İtalya (IT)", value: "IT" },
  { label: "İspanya (ES)", value: "ES" }, { label: "Avusturya (AT)", value: "AT" },
];
const COUNTRY_NAMES: Record<string, string> = { TR: "Türkiye", DE: "Almanya", NL: "Hollanda", FR: "Fransa", GB: "İngiltere", US: "Amerika", IT: "İtalya", ES: "İspanya", AT: "Avusturya" };

const POSTAL_CODES: Record<string, { label: string; value: string }[]> = {
  DE: [{ label: "10115 - Berlin", value: "10115" }, { label: "80331 - Münih", value: "80331" }, { label: "20095 - Hamburg", value: "20095" }],
  NL: [{ label: "1011 - Amsterdam", value: "1011" }, { label: "3011 - Rotterdam", value: "3011" }],
  FR: [{ label: "75001 - Paris", value: "75001" }, { label: "69001 - Lyon", value: "69001" }],
  GB: [{ label: "SW1A 1AA - Londra", value: "SW1A 1AA" }, { label: "M1 1AE - Manchester", value: "M1 1AE" }],
  US: [{ label: "10001 - New York", value: "10001" }, { label: "90001 - Los Angeles", value: "90001" }],
  AT: [{ label: "1010 - Viyana", value: "1010" }, { label: "5020 - Salzburg", value: "5020" }],
};
function getPostalCodesForCountry(code: string) { return POSTAL_CODES[code] || []; }

function FlagDE({ className }: { className?: string }) { return <svg viewBox="0 0 5 3" className={className}><rect width="5" height="1" y="0" fill="#000"/><rect width="5" height="1" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg>; }
function FlagFR({ className }: { className?: string }) { return <svg viewBox="0 0 3 2" className={className}><rect width="1" height="2" x="0" fill="#002395"/><rect width="1" height="2" x="1" fill="#FFF"/><rect width="1" height="2" x="2" fill="#ED2939"/></svg>; }
function FlagGB({ className }: { className?: string }) { return <svg viewBox="0 0 60 30" className={className}><rect width="60" height="30" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/></svg>; }
function FlagUS({ className }: { className?: string }) { return <svg viewBox="0 0 190 100" className={className}><rect width="190" height="100" fill="#B22234"/>{[0,1,2,3,4,5,6].map(i=><rect key={i} y={i*15.38} width="190" height="7.69" fill="#FFF"/>)}<rect width="76" height="53.85" fill="#3C3B6E"/></svg>; }
function FlagIT({ className }: { className?: string }) { return <svg viewBox="0 0 3 2" className={className}><rect width="1" height="2" x="0" fill="#009246"/><rect width="1" height="2" x="1" fill="#FFF"/><rect width="1" height="2" x="2" fill="#CE2B37"/></svg>; }
function FlagES({ className }: { className?: string }) { return <svg viewBox="0 0 750 500" className={className}><rect width="750" height="500" fill="#AA151B"/><rect width="750" height="250" y="125" fill="#F1BF00"/></svg>; }
function FlagAT({ className }: { className?: string }) { return <svg viewBox="0 0 900 600" className={className}><rect width="900" height="200" y="0" fill="#ED2939"/><rect width="900" height="200" y="200" fill="#FFF"/><rect width="900" height="200" y="400" fill="#ED2939"/></svg>; }

const FLAG_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = { DE: FlagDE, FR: FlagFR, GB: FlagGB, US: FlagUS, IT: FlagIT, ES: FlagES, AT: FlagAT };

function CountryFlag({ code, size = "md" }: { code: string; size?: "sm" | "md" | "lg" }) {
  const F = FLAG_COMPONENTS[code];
  const s = { sm: "h-6 w-6", md: "h-10 w-10", lg: "h-14 w-14" };
  const d = s[size];
  if (code === "TR") return <div className={cn("shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-md relative", d)}><Image src="/tr.png" alt="TR Flag" fill className="object-cover" /></div>;
  if (code === "NL") return <div className={cn("shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-md relative", d)}><Image src="/netherlands.png" alt="NL Flag" fill className="object-cover" /></div>;
  if (code === "US") return <div className={cn("shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-md relative", d)}><Image src="/us-flag.png" alt="US Flag" fill className="object-cover" /></div>;
  return <div className={cn("shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-md", d)}>{F ? <F className="h-full w-full object-cover scale-[1.6]" /> : <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs font-bold text-gray-500">{code}</div>}</div>;
}

function toNumber(v: string) { const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) ? n : 0; }

// Carrier logo renk haritası (backend logoLetter'dan türetilir)
const CARRIER_LOGO_COLORS: Record<string, string> = {
  F: "bg-[#4D148C]", // FedEx
  U: "bg-[#351C15]", // UPS
  D: "bg-[#D40511]", // DHL
  M: "bg-[#E30613]", // MNG
  A: "bg-[#003B7A]", // Aras
  Y: "bg-[#00843D]", // Yurtiçi
  T: "bg-[#0033A0]", // TNT
};
function getLogoColor(q: ApiCarrierQuote): string {
  return q.logoColor || CARRIER_LOGO_COLORS[q.logoLetter] || "bg-slate-600";
}
function isHexColor(color: string): boolean {
  return color.startsWith("#");
}
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
function getLogoSrc(url: string): string {
  // data URI veya tam URL ise olduğu gibi döndür, relative path ise API_BASE ile prefix'le
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}
function CarrierLogo({ q, size = "h-11 w-11", textSize = "text-sm" }: { q: ApiCarrierQuote; size?: string; textSize?: string }) {
  if (q.logoUrl) {
    // Görsel varsa: Arka planı her zaman beyaz (bg-white) yapıp, dışına hafif bir çerçeve (ring-1 ring-slate-200) koyuyoruz.
    // İçindeki resmi de object-contain ile taşmadan merkeze oturtuyoruz.
    return (
      <div className={cn("flex shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden", size)}>
        <img src={getLogoSrc(q.logoUrl)} alt={q.carrierName} className="h-[70%] w-[70%] object-contain" />
      </div>
    );
  }
  
  // Görsel yoksa, sadece harf varsa eski mantık devam ediyor
  const color = getLogoColor(q);
  const hex = isHexColor(color);
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm", size, textSize, !hex && color)}
      style={hex ? { backgroundColor: color } : undefined}
    >
      {q.logoLetter}
    </div>
  );
}
function getCurrencySymbol(currency: string): string {
  if (currency === "EUR") return "€";
  if (currency === "GBP") return "£";
  return "$";
}

function Field({ label, icon: Icon, children }: { label: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <label className="block group">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
        {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
        <span>{label}</span>
      </div>
      <div className="rounded-2xl border-[2px] border-slate-200 bg-transparent p-1 transition-all group-focus-within:border-brand-500 group-focus-within:bg-brand-50/10 group-focus-within:shadow-sm hover:border-slate-300">
        {React.Children.map(children, child => {
          if (React.isValidElement<{ className?: string }>(child)) {
            return React.cloneElement(child, { className: cn(child.props.className, "border-0 ring-0 focus:ring-0 focus-visible:ring-0 shadow-none bg-transparent") } as any);
          }
          return child;
        })}
      </div>
    </label>
  );
}

function CarrierTag({ tag }: { tag: string }) {
  const m: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
    recommended: { label: "Tavsiye Edilen", icon: Star, cls: "bg-amber-50 text-amber-700 ring-amber-200" },
    fastest: { label: "En Hızlı", icon: Zap, cls: "bg-sky-50 text-sky-700 ring-sky-200" },
    cheapest: { label: "En Uygun", icon: BadgeDollarSign, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  };
  const t = m[tag]; if (!t) return null; const I = t.icon;
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1", t.cls)}><I className="h-3 w-3" />{t.label}</span>;
}

function CarrierCard({ quote: q, selected, onSelect }: { quote: ApiCarrierQuote; selected: boolean; onSelect: () => void }) {
  const logoColor = getLogoColor(q);
  const sym = getCurrencySymbol(q.currency);
  return (
    <button type="button" onClick={onSelect} className={cn("group relative flex flex-col rounded-2xl p-5 text-left ring-1 transition-all", selected ? "bg-brand-50/60 ring-2 ring-brand-500 shadow-sm" : "bg-surface ring-border hover:ring-brand-200 hover:shadow-sm", q.tags.includes("recommended") && !selected && "ring-amber-200 bg-amber-50/30")}>
      {q.tags.length > 0 && <div className="mb-3 flex flex-wrap items-center gap-1.5">{q.tags.map((t: string) => <CarrierTag key={t} tag={t} />)}</div>}
      <div className="flex items-center gap-3">
        <CarrierLogo q={q} />
        <div className="min-w-0 flex-1"><div className="text-sm font-semibold leading-tight">{q.carrierName}</div><div className="text-xs text-muted">{q.serviceName}</div></div>
        <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1", selected ? "bg-brand-600 ring-brand-600 text-white" : "bg-surface ring-border group-hover:ring-brand-300")}>{selected && <Check className="h-3.5 w-3.5" />}</div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Clock className="h-3.5 w-3.5" /><span>Teslimat: <span className="font-medium text-foreground">{q.deliveryLabel}</span></span></div>
      <div className="mt-3 flex items-baseline gap-2"><span className="text-2xl font-bold tracking-tight">{sym}{q.price.toFixed(2)}</span><span className="text-sm text-muted">({q.priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺)</span></div>
      <div className="mt-1.5 text-xs text-muted">İade Masrafı: {sym}{q.returnCost.toFixed(2)}</div>
    </button>
  );
}

function TopPickCard({ label, icon: Icon, carrier, price, currency, days, colorClass }: { label: string; icon: React.ComponentType<{ className?: string }>; carrier: string; price: number; currency: string; days: string; colorClass: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl p-4 ring-1", colorClass)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1"><div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</div><div className="mt-0.5 text-sm font-semibold leading-tight">{carrier}</div><div className="mt-0.5 text-xs opacity-80">{currency}{price.toFixed(2)} · {days}</div></div>
    </div>
  );
}

function CarrierListItem({ quote: q, selected, onSelect }: { quote: ApiCarrierQuote; selected: boolean; onSelect: () => void }) {
  const logoColor = getLogoColor(q);
  const sym = getCurrencySymbol(q.currency);
  const hasTag = q.tags.length > 0;
  const tagBg = !selected && hasTag
    ? q.tags.includes("cheapest") ? "bg-emerald-50/40 ring-emerald-200"
    : q.tags.includes("fastest") ? "bg-sky-50/40 ring-sky-200"
    : q.tags.includes("recommended") ? "bg-amber-50/40 ring-amber-200"
    : ""
    : "";
  return (
    <button type="button" onClick={onSelect} className={cn("group flex w-full flex-col rounded-2xl p-4 text-left ring-1 transition-all", selected ? "bg-brand-50/60 ring-2 ring-brand-500 shadow-sm" : tagBg || "bg-surface ring-border hover:ring-brand-200 hover:shadow-sm")}>
      {hasTag && <div className="mb-2.5 flex flex-wrap items-center gap-1.5">{q.tags.map((t: string) => <CarrierTag key={t} tag={t} />)}</div>}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <CarrierLogo q={q} size="h-10 w-10" textSize="text-xs" />
          <div className="min-w-0 max-w-[150px] sm:max-w-[200px]">
            <span className="text-sm font-semibold leading-tight">{q.carrierName}</span>
            <div className="text-xs text-muted">{q.serviceName}</div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div className="hidden sm:block text-xs text-muted">
            <div className="flex items-center gap-1.5 justify-end"><Clock className="h-3.5 w-3.5" /><span>Teslimat: <span className="font-medium text-foreground">{q.deliveryLabel}</span></span></div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-lg font-bold tracking-tight">{sym}{q.price.toFixed(2)}</span>
              <span className="text-xs text-muted w-16 text-right">({q.priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺)</span>
            </div>
            <div className="mt-0.5 text-[10px] text-muted">İade Masrafı: {sym}{q.returnCost.toFixed(2)}</div>
          </div>
          <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1", selected ? "bg-brand-600 ring-brand-600 text-white" : "bg-surface ring-border group-hover:ring-brand-300")}>{selected && <Check className="h-3.5 w-3.5" />}</div>
        </div>
      </div>
    </button>
  );
}

function RouteSummaryBar({ senderCountry, senderName, senderFlag, receiverCountry, receiverName, receiverFlag, chargeableWeight }: { senderCountry: string; senderName?: string; senderFlag?: string; receiverCountry: string; chargeableWeight: number; receiverName?: string; receiverFlag?: string }) {
  const flagImg = (src: string | undefined, code: string) => src
    ? <div className="shrink-0 overflow-hidden h-9 w-9 relative" style={{ borderRadius: 10 }}><img src={src} alt={code} className="w-full h-full object-cover" /></div>
    : <CountryFlag code={code} size="lg" />;
  return (
    <div className="flex items-center justify-between rounded-2xl p-3 sm:p-4 text-white" style={{ backgroundColor: "#161616", minHeight: 66, boxShadow: "0 0 0 1px rgba(0,0,0,0.02), 0 1px 3px 0 rgba(0,0,0,0.08)" }}>
      <div className="flex items-center gap-1.5">{flagImg(senderFlag, senderCountry)}<div><div className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-white/50">Çıkış</div><div className="text-[12px] sm:text-[14px] font-bold leading-tight">{senderName || (COUNTRY_NAMES[senderCountry] ?? senderCountry)}</div></div></div>
      <div className="flex items-center gap-1 sm:gap-2 shrink min-w-0"><div className="h-px w-4 sm:w-12 bg-white/20" /><div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[12px] text-white/50"><Plane className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /><span className="hidden sm:inline">Kargo Ağırlığı </span><span className="font-semibold text-white/80">{chargeableWeight.toFixed(2)} kg</span></div><div className="h-px w-4 sm:w-12 bg-white/20" /></div>
      <div className="flex items-center gap-1.5"><div className="text-right"><div className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-white/50">Varış</div><div className="text-[12px] sm:text-[14px] font-bold leading-tight">{receiverName || COUNTRY_NAMES[receiverCountry] || receiverCountry}</div></div>{flagImg(receiverFlag, receiverCountry)}</div>
    </div>
  );
}

function AddressCard({ addr, selected, onSelect, onDelete }: { addr: ApiAddress; selected: boolean; onSelect: () => void; onDelete?: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={cn("group relative flex flex-col rounded-2xl p-4 text-left ring-1 transition-all", selected ? "bg-brand-50/60 ring-2 ring-brand-500 shadow-sm" : "bg-surface ring-border hover:ring-brand-200 hover:shadow-sm")}>
      <div className="absolute right-3 top-3"><div className={cn("flex h-6 w-6 items-center justify-center rounded-full ring-1", selected ? "bg-brand-600 ring-brand-600 text-white" : "bg-surface ring-border group-hover:ring-brand-300")}>{selected && <Check className="h-3.5 w-3.5" />}</div></div>
      <div className="text-sm font-semibold text-foreground pr-8">{addr.label}</div>
      <div className="mt-2 space-y-1 text-xs text-muted">
        <div className="flex items-center gap-1.5"><User className="h-3 w-3 shrink-0 text-brand-500" /><span>{addr.name}</span>{addr.company && <span className="text-muted">/ {addr.company}</span>}</div>
        <div className="flex items-center gap-1.5"><MapPinned className="h-3 w-3 shrink-0 text-brand-500" /><span>{addr.address}</span></div>
        <div className="flex items-center gap-1.5"><Building className="h-3 w-3 shrink-0 text-brand-500" /><span>{addr.postalCode} / {addr.city}</span></div>
        <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0 text-brand-500" /><span>{addr.phone}</span></div>
      </div>
      {onDelete && <div className="absolute bottom-3 right-3"><div role="button" tabIndex={0} onClick={e => { e.stopPropagation(); onDelete(); }} onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); onDelete(); } }} className="flex h-7 w-7 items-center justify-center rounded-full text-red-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></div></div>}
    </button>
  );
}

/* ── Shipment type descriptions for Step 0 ── */
const SHIPMENT_TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; description: string; badge?: string; emoji: string }> = {
  Belge: { icon: FileText,  description: "Dosya, sözleşme, fatura vb.", emoji: "📄" },
  Paket: { icon: Package, description: "Ürün, aksesuar, numune vb.", badge: "En çok tercih edilen", emoji: "📦" },
  Koli:  { icon: BoxSelect,  description: "Ürün, aksesuar, numune vb.", emoji: "📦" },
};

/* ── Pending draft info type (for the resume banner) ── */
type PendingDraftInfo = {
  shipmentId: number;
  currentStep: number;
  shipmentType?: string;
  receiverCountry?: string;
  receiverPostalCode?: string;
  rawDraft: any; // Full draft response from API
};
export const descriptionTypeService = {
  async list(): Promise<{ types: { id: number; label: string }[] }> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${API_BASE}/api/shipment-description-types`);
    if (!res.ok) throw new Error("Gönderi açıklama tipleri alınamadı");
    return res.json();
  },
};

export default function GonderiOlusturPage() {
  const { hydrated } = useAppState();
  const searchParams = useSearchParams();
  const urlDraftId = searchParams.get("draft");
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<ShipmentDraft>(DEFAULT_DRAFT);
  const [shipmentId, setShipmentId] = React.useState<number | null>(null);
  const [done, setDone] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [showNewSenderForm, setShowNewSenderForm] = React.useState(false);
  const [showNewReceiverForm, setShowNewReceiverForm] = React.useState(false);
  const [showServicesModal, setShowServicesModal] = React.useState(false);
  const [senderSearch, setSenderSearch] = React.useState("");
  const [receiverSearch, setReceiverSearch] = React.useState("");
  const [apiCountries, setApiCountries] = React.useState<any[]>([]);
  const [apiQuotes, setApiQuotes] = React.useState<ApiCarrierQuote[]>([]);
  const [quotesMessage, setQuotesMessage] = React.useState<string | null>(null);
  const [apiAddresses, setApiAddresses] = React.useState<ApiAddress[]>([]);
  const [apiMeasurements, setApiMeasurements] = React.useState<ApiMeasurement[]>([]);
const [showProformaExcel, setShowProformaExcel] = React.useState(false);
const [descriptionTypes, setDescriptionTypes] = React.useState<{ id: number; label: string }[]>([]);
  console.log("apiQuotes", apiQuotes)
  // ── Taslak banner state'leri ──────────────────────────────────────────────
  const [pendingDraft, setPendingDraft] = React.useState<PendingDraftInfo | null>(null);
  const [draftBannerDismissed, setDraftBannerDismissed] = React.useState(false);
  const [draftLoading, setDraftLoading] = React.useState(!!urlDraftId);
const [showPackageExcel, setShowPackageExcel] = React.useState(false);
  const [showMoreCarriers, setShowMoreCarriers] = React.useState(true);
  const [addressTab, setAddressTab] = React.useState<"sender" | "receiver">("sender");

  // ── Gümrük Belgeleri Yükleme State'leri ──
  const [docFileType, setDocFileType] = React.useState("INVOICE");
  const [docUploading, setDocUploading] = React.useState(false);
  const [docUploadedFiles, setDocUploadedFiles] = React.useState<any[]>([]);
  const [docDragOver, setDocDragOver] = React.useState(false);
  const [docError, setDocError] = React.useState<string | null>(null);
  const [docSuccess, setDocSuccess] = React.useState<string | null>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);
  // ── Ülkeler (kendi backend'imizden + Türkçe isimler + flagcdn.com bayrakları) ─
  React.useEffect(() => {
    // Türkçe ülke adı çevirici (tarayıcı yerleşik API)
    const trNames = new Intl.DisplayNames(["tr"], { type: "region" });

    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${API_BASE}/api/countries`)
      .then(res => res.json())
      .then((data: { isoCode: string; phoneCode?: string; countryName: string }[]) => {
        if (!Array.isArray(data)) return;
        const mapped = data.map((c) => {
          const code = c.isoCode.toUpperCase();
          // Tarayıcı API'si ile Türkçe ad al; yoksa backend adını kullan
          let trName = c.countryName;
          try { trName = trNames.of(code) || c.countryName; } catch {}
          // ABD bayrağı için yerel dosya kullan (flagcdn "ABD" kodunu tanımıyor)
          const isUS = code === "US" || code === "ABD";
          const flagUrl = isUS ? "/us-flag.png" : `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
          return {
            value: code,
            name: trName,
            flag: flagUrl,
            phoneCode: c.phoneCode || "",
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
        setApiCountries(mapped);
      }).catch(console.error);
  }, []);


  // ── Sayfa yüklenince: adresler + ölçüler + taslak kontrolü (otomatik yükleme YOK) ─
  React.useEffect(() => {
    if (!hydrated) return;
    // Adresler
    addressService.list().then(r => { setApiAddresses(r.addresses); setAddressesLoaded(true); }).catch(() => { setAddressesLoaded(true); });
    // Ölçüler
    measurementService.list().then(r => setApiMeasurements(r.measurements)).catch(() => {});
    // URL'de draftId varsa banner için tekrar taslak çekme (Race condition önlemi)
    if (urlDraftId) return;
    // Mevcut taslak var mı kontrol et (ama otomatik yükleme)
    shipmentService.getDraft().then(r => {
      if (!r.draft) return;
      const d = r.draft;
      // Taslak varsa sadece banner bilgisini sakla
      setPendingDraft({
        shipmentId: d.shipmentId,
        currentStep: d.currentStep,
        shipmentType: d.shipmentType,
        receiverCountry: d.receiverCountry,
        receiverPostalCode: d.receiverPostalCode,
        rawDraft: d,
      });
    }).catch(() => {});
  }, [hydrated, urlDraftId]);

  // ── URL'den gelen ?draft=ID ile otomatik taslak yükleme ────────────────────
  React.useEffect(() => {
    if (!hydrated || !urlDraftId) return;
    const draftId = Number(urlDraftId);
    if (!draftId || Number.isNaN(draftId)) return;
    // Zaten bu taslak yüklüyse tekrar yükleme
    if (shipmentId === draftId) return;

    setDraftLoading(true);
    shipmentService.getDraftById(draftId)
      .then(async r => {
        if (!r.draft) {
          setDraftLoading(false);
          return;
        }
        const d = r.draft;
        setShipmentId(d.shipmentId);

        const isQuick = searchParams.get("quick") === "1";

        const newPackages = (d.packages?.length ?? 0) > 0 ? d.packages.map((p: any, i: number) => ({
          id: String(i), widthCm: String(p.widthCm), lengthCm: String(p.lengthCm),
          heightCm: String(p.heightCm), weightKg: String(p.weightKg), packageCount: String(p.packageCount),
          selectedPreset: "", saveMeasurement: false, measurementLabel: "",
        })) : undefined;

        setDraft(prev => ({
          ...prev,
          shipmentType: (d.shipmentType as any) || prev.shipmentType,
          receiverCountry: d.receiverCountry || prev.receiverCountry,
          receiverPostalCode: d.receiverPostalCode || prev.receiverPostalCode,
          selectedCarrierId: d.selectedCarrierId || prev.selectedCarrierId,
          hasInsurance: d.hasInsurance,
          selectedSenderAddressId: d.senderAddressId ? String(d.senderAddressId) : prev.selectedSenderAddressId,
          selectedReceiverAddressId: d.receiverAddressId ? String(d.receiverAddressId) : prev.selectedReceiverAddressId,
          receiverName: d.receiverName || prev.receiverName,
          receiverCompany: d.receiverCompany || prev.receiverCompany,
          receiverPhone: d.receiverPhone || prev.receiverPhone,
          receiverAddress: d.receiverAddress || prev.receiverAddress,
          receiverCity: d.receiverCity || prev.receiverCity,
          receiverStateProvince: (d as any).receiverStateProvince || prev.receiverStateProvince,
          receiverAddressCountry: (d as any).receiverAddressCountry || prev.receiverAddressCountry,
          receiverAddressPostalCode: (d as any).receiverAddressPostalCode || prev.receiverAddressPostalCode,
          proformaDescription: (d.proformaDescription as any) || prev.proformaDescription,
          proformaCurrency: (d.proformaCurrency as any) || prev.proformaCurrency,
          proformaIOSS: d.proformaIOSS || prev.proformaIOSS,
          packages: newPackages || prev.packages,
          proformaItems: (d.proformaItems?.length ?? 0) > 0 ? d.proformaItems.map((item: any, i: number) => ({
            id: String(i),
            productDescription: item.productDescription, hsCode: item.hsCode, sku: item.sku,
            quantity: String(item.quantity), unitPrice: String(item.unitPrice), origin: item.originCountry,
          })) : prev.proformaItems,
        }));
        setPendingDraft(null);
        setDraftBannerDismissed(true);

        if (isQuick) {
          // quick=1: Taslaktaki paket bilgilerinden fiyat tekliflerini çek ve doğrudan fiyatlandırma adımına geç
          try {
            const senderCountry = d.senderCountry || "TR";
            const receiverCountry = d.receiverCountry || "";
            const receiverPostalCode = d.receiverPostalCode || "";
            const packages = (newPackages || []).map((p: any) => ({
              widthCm: toNumber(p.widthCm),
              lengthCm: toNumber(p.lengthCm),
              heightCm: toNumber(p.heightCm),
              weightKg: toNumber(p.weightKg),
              packageCount: Math.max(1, Math.round(toNumber(p.packageCount))),
            }));

            const quoteRes = await shipmentService.getQuotes({
              senderCountry,
              receiverCountry,
              receiverPostalCode,
              packages,
              shipmentType: d.shipmentType || "Paket",
            });
            const quotes = quoteRes.quotes ?? [];
            setApiQuotes(quotes);
            setQuotesMessage(quotes.length === 0 ? (quoteRes.message || "Bu rota için kargo firması bulunamadı.") : null);

            // Tavsiye edilen kargoyu seç
            const rec = quotes.find((q: ApiCarrierQuote) => q.tags.includes("recommended"));
            const defaultId = rec?.carrierId || quotes[0]?.carrierId || "";
            setDraft(prev => ({ ...prev, selectedCarrierId: defaultId }));

            setStep(2); // Fiyatlandırma adımına atla
          } catch (err: any) {
            // Fiyat çekme başarısız olsa bile fiyatlandırma adımına at, hatayı göster
            setQuotesMessage(err?.message || "Fiyat bilgileri alınamadı, lütfen tekrar deneyin.");
            setStep(2);
          }
        } else {
          setStep(Math.min(d.currentStep, STEPS.length - 2));
        }

        setDraftLoading(false);
      })
      .catch(() => {
        setDraftLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, urlDraftId]);

  // ── Description types ────────────────────────────────────────────
  React.useEffect(() => {
    descriptionTypeService.list()
      .then(r => setDescriptionTypes(r.types))
      .catch(console.error);
  }, []);

  // ── Taslaktan devam et fonksiyonu (banner'a tıklanınca) ───────────────────
  function resumeFromDraft() {
    if (!pendingDraft) return;
    setDraftLoading(true);
    const d = pendingDraft.rawDraft;

    setShipmentId(d.shipmentId);
    setStep(Math.min(d.currentStep, STEPS.length - 2));
    setDraft(prev => ({
      ...prev,
      shipmentType: (d.shipmentType as any) || prev.shipmentType,
      receiverCountry: d.receiverCountry || prev.receiverCountry,
      receiverPostalCode: d.receiverPostalCode || prev.receiverPostalCode,
      selectedCarrierId: d.selectedCarrierId || prev.selectedCarrierId,
      hasInsurance: d.hasInsurance,
      selectedSenderAddressId: d.senderAddressId ? String(d.senderAddressId) : prev.selectedSenderAddressId,
      selectedReceiverAddressId: d.receiverAddressId ? String(d.receiverAddressId) : prev.selectedReceiverAddressId,
      receiverName: d.receiverName || prev.receiverName,
      receiverCompany: d.receiverCompany || prev.receiverCompany,
      receiverPhone: d.receiverPhone || prev.receiverPhone,
      receiverAddress: d.receiverAddress || prev.receiverAddress,
      receiverCity: d.receiverCity || prev.receiverCity,
      receiverStateProvince: d.receiverStateProvince || prev.receiverStateProvince,
      receiverAddressCountry: d.receiverAddressCountry || prev.receiverAddressCountry,
      receiverAddressPostalCode: d.receiverAddressPostalCode || prev.receiverAddressPostalCode,
      proformaDescription: (d.proformaDescription as any) || prev.proformaDescription,
      proformaCurrency: (d.proformaCurrency as any) || prev.proformaCurrency,
      proformaIOSS: d.proformaIOSS || prev.proformaIOSS,
      packages: (d.packages?.length ?? 0) > 0 ? d.packages.map((p: any, i: number) => ({
        id: String(i), widthCm: String(p.widthCm), lengthCm: String(p.lengthCm),
        heightCm: String(p.heightCm), weightKg: String(p.weightKg), packageCount: String(p.packageCount),
        selectedPreset: "", saveMeasurement: false, measurementLabel: "",
      })) : prev.packages,
      proformaItems: (d.proformaItems?.length ?? 0) > 0 ? d.proformaItems.map((item: any, i: number) => ({
        id: String(i),
        productDescription: item.productDescription, hsCode: item.hsCode, sku: item.sku,
        quantity: String(item.quantity), unitPrice: String(item.unitPrice), origin: item.originCountry,
      })) : prev.proformaItems,
    }));

    setPendingDraft(null);
    setDraftBannerDismissed(true);
    setDraftLoading(false);
  }

  function dismissDraftBanner() {
    setDraftBannerDismissed(true);
  }

  // ── Hesaplamalar ──────────────────────────────────────────────────────────
  const totalVolumetricWeight = React.useMemo(() => {
    return draft.packages.reduce((sum, pkg) => {
      const w = Math.max(toNumber(pkg.widthCm), 0), l = Math.max(toNumber(pkg.lengthCm), 0), h = Math.max(toNumber(pkg.heightCm), 0);
      const v = (w * l * h) / 5000;
      return sum + (Number.isFinite(v) ? v : 0) * Math.max(1, toNumber(pkg.packageCount));
    }, 0);
  }, [draft.packages]);

  const totalActualWeight = React.useMemo(() => {
    return draft.packages.reduce((sum, pkg) => sum + Math.max(toNumber(pkg.weightKg), 0) * Math.max(1, toNumber(pkg.packageCount)), 0);
  }, [draft.packages]);

  const selectedQuote = apiQuotes.find(q => q.carrierId === draft.selectedCarrierId);

  const chargeableWeight = draft.packages.reduce((sum, pkg) => {
    const w = Math.max(toNumber(pkg.widthCm), 0), l = Math.max(toNumber(pkg.lengthCm), 0), h = Math.max(toNumber(pkg.heightCm), 0);
    const v = (Number.isFinite((w * l * h) / 5000) ? (w * l * h) / 5000 : 0);
    const weight = Math.max(toNumber(pkg.weightKg), 0);
    return sum + Math.max(weight, v) * Math.max(1, toNumber(pkg.packageCount));
  }, 0);

  const totalPackageCount = draft.packages.reduce((sum, pkg) => sum + Math.max(1, Math.round(toNumber(pkg.packageCount))), 0);

  // Adresler
  const SAVED_SENDER_ADDRESSES = React.useMemo(() => apiAddresses.filter(a => a.type === "sender"), [apiAddresses]);
  const SAVED_RECEIVER_ADDRESSES = React.useMemo(() => apiAddresses.filter(a => a.type === "receiver"), [apiAddresses]);
  
  const filteredSenderAddresses = React.useMemo(() => {
    const q = senderSearch.toLowerCase().trim();
    return SAVED_SENDER_ADDRESSES.filter(a => !q || a.label.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || (a.company || "").toLowerCase().includes(q));
  }, [senderSearch, SAVED_SENDER_ADDRESSES]);

  const filteredReceiverAddresses = React.useMemo(() => {
    const q = receiverSearch.toLowerCase().trim();
    return SAVED_RECEIVER_ADDRESSES.filter(a => !q || a.label.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || (a.company || "").toLowerCase().includes(q));
  }, [receiverSearch, SAVED_RECEIVER_ADDRESSES]);

  // Kayıtlı adres yoksa yeni adres formunu otomatik aç
  const [addressesLoaded, setAddressesLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!addressesLoaded) return;
    if (SAVED_SENDER_ADDRESSES.length === 0) {
      setShowNewSenderForm(true);
    }
    if (SAVED_RECEIVER_ADDRESSES.length === 0) {
      setShowNewReceiverForm(true);
    }
  }, [addressesLoaded, SAVED_SENDER_ADDRESSES.length, SAVED_RECEIVER_ADDRESSES.length]);

  const proformaTotal = React.useMemo(() => draft.proformaItems.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice), 0), [draft.proformaItems]);
  const currencySymbol = draft.proformaCurrency === "EUR" ? "€" : draft.proformaCurrency === "USD" ? "$" : "£";

  // ── Proforma step'e girilince miktar = toplam koli sayısı ─────────────────
  React.useEffect(() => {
    if (step !== 3) return;
    const totalPkgCount = draft.packages.reduce((sum, p) => sum + (Number(p.packageCount) || 1), 0);
    if (totalPkgCount <= 0) return;
    setDraft(d => ({
      ...d,
      proformaItems: d.proformaItems.map(item =>
        item.quantity === "" || item.quantity === "1"
          ? { ...item, quantity: String(totalPkgCount) }
          : item
      ),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Adım 3'e (Adres) girilince alıcı ülkesini otomatik doldur ─────────────
  React.useEffect(() => {
    if (step !== 3) return; // step index 3 = Adres Seçimi
    // receiverCountry step 0'da seçilmişti, receiverAddressCountry boşsa doldur
    if (draft.receiverCountry && !draft.receiverAddressCountry) {
      setDraft(d => ({ ...d, receiverAddressCountry: d.receiverCountry }));
      // Telefon kodunu da otomatik doldur
      const country = apiCountries.find((c: any) => c.value === draft.receiverCountry);
      if (country?.phoneCode && !draft.receiverPhone) {
        setDraft(d => ({ ...d, receiverPhone: (country as any).phoneCode }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);


  // ── Draft mutators ────────────────────────────────────────────────────────
  function update<K extends keyof ShipmentDraft>(key: K, value: ShipmentDraft[K]) { setDraft(d => ({ ...d, [key]: value })); }
  function updateProformaItem(itemId: string, field: keyof ProformaItem, value: string) { setDraft(d => ({ ...d, proformaItems: d.proformaItems.map(i => i.id === itemId ? { ...i, [field]: value } : i) })); }
  function addProformaItem() {
    const totalPkgCount = draft.packages.reduce((sum, p) => sum + (Number(p.packageCount) || 1), 0);
    setDraft(d => ({ ...d, proformaItems: [...d.proformaItems, { ...EMPTY_PROFORMA_ITEM, id: crypto.randomUUID(), quantity: String(totalPkgCount || 1) }] }));
  }
  function removeProformaItem(itemId: string) { setDraft(d => ({ ...d, proformaItems: d.proformaItems.filter(i => i.id !== itemId) })); }

  function updatePackageItem(itemId: string, field: keyof PackageItem, value: any) { setDraft(d => ({ ...d, packages: d.packages.map(i => i.id === itemId ? { ...i, [field]: value, ...(field !== "selectedPreset" && field !== "saveMeasurement" && field !== "measurementLabel" && field !== "packageCount" ? { selectedPreset: "" } : {}) } : i) })); }
  function addPackageItem() { setDraft(d => ({ ...d, packages: [...d.packages, { ...EMPTY_PACKAGE_ITEM, id: crypto.randomUUID() }] })); }
  function removePackageItem(itemId: string) { setDraft(d => ({ ...d, packages: d.packages.filter(i => i.id !== itemId) })); }

  function applyPresetToPackage(itemId: string, presetId: string) {
    if (!presetId) { updatePackageItem(itemId, "selectedPreset", ""); return; }
    const p = apiMeasurements.find(x => String(x.id) === presetId); if (!p) return;
    setDraft(d => ({ ...d, packages: d.packages.map(i => i.id === itemId ? { ...i, selectedPreset: presetId, widthCm: String(p.widthCm), lengthCm: String(p.lengthCm), heightCm: String(p.heightCm), weightKg: String(p.weightKg) } : i) }));
  }
  function importProformaFromExcel(rows: ParsedProformaRow[]) {
  const items = rows.map((r) => ({
    id: crypto.randomUUID(),
    productDescription: r.productDescription,
    hsCode: r.hsCode,
    sku: r.sku,
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    origin: r.origin || "TR",
  }));
  setDraft((d) => ({ ...d, proformaItems: items }));
  setShowProformaExcel(false);
}
function importPackagesFromExcel(rows: ParsedPackageRow[]) {
  const items = rows.map((r) => ({
    id: crypto.randomUUID(),
    widthCm: r.widthCm,
    lengthCm: r.lengthCm,
    heightCm: r.heightCm,
    weightKg: r.weightKg,
    packageCount: r.packageCount,
    selectedPreset: "",
    saveMeasurement: false,
    measurementLabel: "",
  }));
  setDraft((d) => ({ ...d, packages: items }));
  setShowPackageExcel(false);
}
  // ── Adım ilerleme (API çağrılı) ─────────────────────────────────────────────
  
  async function saveProformaDetails() {
    // Proforma specific validation
    const errors: Record<string, string> = {};
    if (!draft.proformaDescription) errors.proformaDescription = "Zorunlu";
    if (!draft.proformaCurrency) errors.proformaCurrency = "Zorunlu";
    
    draft.proformaItems.forEach((item, idx) => {
      if (!item.origin) errors[`item_${idx}_origin`] = "Zorunlu";
      if (!item.productDescription) errors[`item_${idx}_productName`] = "Zorunlu";
      if (!item.hsCode) errors[`item_${idx}_hsCode`] = "Zorunlu";
      if (!item.quantity || toNumber(item.quantity) <= 0) errors[`item_${idx}_quantity`] = "Zorunlu";
      if (!item.unitPrice || toNumber(item.unitPrice) <= 0) errors[`item_${idx}_unitPrice`] = "Zorunlu";
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setApiError("Lütfen zorunlu alanları doldurunuz.");
      return;
    }

    setFieldErrors({});
    await next();
  }

  async function next() {
    setApiError(null);
    setLoading(true);
    try {
      if (step === 0) {
        if (!draft.receiverCountry || !draft.receiverPostalCode) {
          setApiError("Alıcı ülke ve posta kodu zorunludur."); setLoading(false); return;
        }
        // Taslak oluştur veya güncelle (step 0)
        let sid = shipmentId;
        if (!sid) {
          const res = await shipmentService.createDraft({
            shipmentType: draft.shipmentType,
            receiverCountry: draft.receiverCountry,
            receiverPostalCode: draft.receiverPostalCode,
          });
          sid = res.shipmentId;
          setShipmentId(sid);
        } else {
          await shipmentService.updateDraft(sid, 0, {
            shipmentType: draft.shipmentType,
            receiverCountry: draft.receiverCountry,
            receiverPostalCode: draft.receiverPostalCode,
          });
        }

        // Belge tipi seçildiyse: sabit 0.5 Hacimsel Ağırlık, paket adımını atla, direkt fiyatlandırmaya git
        if (draft.shipmentType === "Belge") {
          const belgePackages = [{ widthCm: 1, lengthCm: 1, heightCm: 1, weightKg: 0.5, packageCount: 1 }];
          // Paket bilgisini backend'e kaydet
          await shipmentService.updateDraft(sid!, 1, { packages: belgePackages, saveMeasurements: [] });
          // Sabit paketi draft state'ine yaz
          setDraft(d => ({
            ...d,
            packages: [{
              id: crypto.randomUUID(),
              widthCm: "1", lengthCm: "1", heightCm: "1", weightKg: "0.5",
              packageCount: "1", selectedPreset: "", saveMeasurement: false, measurementLabel: "",
            }],
          }));
          // Fiyat tekliflerini çek
          const quoteRes = await shipmentService.getQuotes({
            senderCountry: draft.senderCountry,
            receiverCountry: draft.receiverCountry,
            receiverPostalCode: draft.receiverPostalCode,
            packages: belgePackages,
            shipmentType: draft.shipmentType,
          });
          const quotes = quoteRes.quotes ?? [];
          setApiQuotes(quotes);
          setQuotesMessage(quotes.length === 0 ? (quoteRes.message || "Bu rota için kargo firması bulunamadı.") : null);
          const rec = quotes.find(q => q.tags.includes("recommended"));
          const defaultId = rec?.carrierId || quotes[0]?.carrierId || "";
          setDraft(d => ({ ...d, selectedCarrierId: defaultId }));
          setStep(2); // Fiyatlandırma adımına atla
          setLoading(false);
          return;
        }
      } else if (step === 1) {
        // Paketleri kaydet
        if (!shipmentId) { setApiError("Taslak bulunamadı."); setLoading(false); return; }
        const packages = draft.packages.map(p => ({
          widthCm: toNumber(p.widthCm), lengthCm: toNumber(p.lengthCm),
          heightCm: toNumber(p.heightCm), weightKg: toNumber(p.weightKg),
          packageCount: Math.max(1, Math.round(toNumber(p.packageCount))),
        }));
        const saveMeasurements = draft.packages
          .filter(p => p.saveMeasurement && p.measurementLabel)
          .map(p => ({ label: p.measurementLabel!, widthCm: toNumber(p.widthCm), lengthCm: toNumber(p.lengthCm), heightCm: toNumber(p.heightCm), weightKg: toNumber(p.weightKg) }));
        await shipmentService.updateDraft(shipmentId, 1, { packages, saveMeasurements });
        // Kargo fiyatlarını çek
        const quoteRes = await shipmentService.getQuotes({
          senderCountry: draft.senderCountry,
          receiverCountry: draft.receiverCountry,
          receiverPostalCode: draft.receiverPostalCode,
          packages,
          shipmentType: draft.shipmentType,
        });
        const quotes = quoteRes.quotes ?? [];
        setApiQuotes(quotes);
        setQuotesMessage(quotes.length === 0 ? (quoteRes.message || "Bu rota için kargo firması bulunamadı.") : null);
        // Ölçüleri yenile (saveMeasurement varsa yeni kayıtlar gelmiş olabilir)
        if (saveMeasurements.length > 0) {
          measurementService.list().then(r => setApiMeasurements(r.measurements)).catch(() => {});
        }
        // Tavsiye edilen kargo
        const rec = quotes.find(q => q.tags.includes("recommended"));
        const defaultId = draft.selectedCarrierId || rec?.carrierId || quotes[0]?.carrierId || "";
        setDraft(d => ({ ...d, selectedCarrierId: defaultId }));
      } else if (step === 2) {
        if (!shipmentId) { setApiError("Taslak bulunamadı."); setLoading(false); return; }
        if (!draft.selectedCarrierId) { setApiError("Lütfen bir kargo firması seçin."); setLoading(false); return; }
        
        // Modal geçici olarak kapatıldı, direkt backend'e yaz ve devam et.
        await shipmentService.updateDraft(shipmentId, 2, {
          selectedCarrierId: draft.selectedCarrierId,
          hasInsurance: draft.hasInsurance,
        });
      } else if (step === 3) {
        if (!shipmentId) { setApiError("Taslak bulunamadı."); setLoading(false); return; }
        
        // Yeni Gönderici Adresi Kaydı (artık backend'e paslanacak, o kaydedecek!)
        let finalSenderAddressId = draft.selectedSenderAddressId;
        if (showNewSenderForm) {
          if (!draft.senderName || !draft.senderAddress || !draft.senderCity) {
            setApiError("Lütfen gönderici bilgilerini (Ad, Şehir, Adres) eksiksiz giriniz."); setLoading(false); return;
          }
          finalSenderAddressId = ""; // No existing ID if creating a new form, rely on flat fields
          update("selectedSenderAddressId", "");
        }

        const senderAddr = SAVED_SENDER_ADDRESSES.find(a => String(a.id) === finalSenderAddressId) || null;
        const receiverAddr = SAVED_RECEIVER_ADDRESSES.find(a => String(a.id) === draft.selectedReceiverAddressId) || null;
        
        await shipmentService.updateDraft(shipmentId, 3, {
          senderAddressId: senderAddr ? senderAddr.id : null,
          senderName: draft.senderName,
          senderCompany: draft.senderCompany,
          senderPhone: draft.senderPhone,
          senderAddress: draft.senderAddress,
          senderCity: draft.senderCity,
          saveSenderAddress: draft.saveSenderAddress,
          receiverAddressId: receiverAddr ? receiverAddr.id : null,
          receiverName: draft.receiverName,
          receiverCompany: draft.receiverCompany,
          receiverPhone: draft.receiverPhone,
          receiverAddress: draft.receiverAddress,
          receiverCity: draft.receiverCity,
          receiverStateProvince: draft.receiverStateProvince,
          receiverAddressCountry: draft.receiverAddressCountry,
          receiverAddressPostalCode: draft.receiverAddressPostalCode,
          saveReceiverAddress: draft.saveReceiverAddress,
        });
        
        // Adres listesini yenile (yeni adres kaydedildiyse)
        if (draft.saveReceiverAddress || (showNewSenderForm && draft.saveSenderAddress)) {
          addressService.list().then(r => setApiAddresses(r.addresses)).catch(() => {});
        }
      } else if (step === 4) {
        if (!shipmentId) { setApiError("Taslak bulunamadı."); setLoading(false); return; }

        // Paket satırı sayısı ile proforma ürün satırı sayısı eşleşmeli
        const packageRowCount = draft.packages.length;
        const proformaItemCount = draft.proformaItems.length;
        if (packageRowCount > 1 && proformaItemCount !== packageRowCount) {
          setApiError(
            `${packageRowCount} farklı koli/paket türü girdiniz, lütfen proformada da ${packageRowCount} adet ürün satırı tanımlayın. ` +
            `Şu an ${proformaItemCount} ürün girilmiş. Lütfen bu bölümü doğru doldurun.`
          );
          setLoading(false);
          return;
        }

        const proformaItems = draft.proformaItems.map(item => ({
          productDescription: item.productDescription, hsCode: item.hsCode, sku: item.sku,
          quantity: Math.max(1, Math.round(toNumber(item.quantity))),
          unitPrice: toNumber(item.unitPrice), originCountry: item.origin || "TR",
        }));
        await shipmentService.updateDraft(shipmentId, 4, {
          proformaDescription: draft.proformaDescription,
          proformaCurrency: draft.proformaCurrency,
          proformaIOSS: draft.proformaIOSS,
          proformaItems,
        });
      }
      setStep(s => Math.min(s + 1, STEPS.length - 1));
      setDone(false);
    } catch (err: any) {
      setApiError(err?.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmServicesAndNext() {
    setShowServicesModal(false);
    setApiError(null);
    if (!shipmentId || !draft.selectedCarrierId) return;
    setLoading(true);
    try {
      await shipmentService.updateDraft(shipmentId, 2, {
        selectedCarrierId: draft.selectedCarrierId,
        hasInsurance: draft.hasInsurance,
      });
      setStep(s => Math.min(s + 1, STEPS.length - 1));
      setDone(false);
    } catch (err: any) {
      setApiError(err?.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  function back() {
    setStep(s => {
      // Belge tipinde fiyatlandırma (step 2) → kargo bilgileri (step 0) atlama
      if (s === 2 && draft.shipmentType === "Belge") return 0;
      return Math.max(s - 1, 0);
    });
    setDone(false);
    setApiError(null);
  }

  async function finalize() {
    if (!shipmentId) return;
    setLoading(true);
    setApiError(null);
    try {
      if (docUploadedFiles.length > 0) {
        await Promise.all(
          docUploadedFiles.map(f => documentService.upload(f.file, shipmentId, f.type))
        ).catch((err: any) => {
          throw new Error("Belgeler yüklenirken hata oluştu: " + (err?.message || "Bilinmeyen Hata"));
        });
      }
      await shipmentService.updateDraft(shipmentId, 5, {});
      setDone(true);
    } catch (err: any) {
      setApiError(err?.message || "Gönderi tamamlanamadı.");
    } finally {
      setLoading(false);
    }
  }

  function resetAndNewShipment() {
    setDraft(DEFAULT_DRAFT); setStep(0); setDone(false); setShipmentId(null);
    setShowNewReceiverForm(false); setReceiverSearch(""); setApiQuotes([]); setApiError(null);
    setPendingDraft(null); setDraftBannerDismissed(true);
  }

  if (!hydrated || draftLoading) return <div className="space-y-5"><Skeleton className="h-[96px] rounded-2xl" /><Skeleton className="h-[420px] rounded-2xl" /></div>;

  const cheapestQ = apiQuotes.find(q => q.tags.includes("cheapest"));
  const fastestQ = apiQuotes.find(q => q.tags.includes("fastest"));
  const recommendedQ = apiQuotes.find(q => q.tags.includes("recommended"));
  const selectedSenderAddr = SAVED_SENDER_ADDRESSES.find(a => String(a.id) === draft.selectedSenderAddressId);


  // Banner gösterilecek mi?
  const showDraftBanner = pendingDraft && !draftBannerDismissed;

  // Taslak için açıklama metni
  const draftStepLabel = pendingDraft ? STEPS[Math.min(pendingDraft.currentStep, STEPS.length - 1)] : "";
  const draftCountryLabel = pendingDraft?.receiverCountry
    ? (COUNTRY_NAMES[pendingDraft.receiverCountry] || pendingDraft.receiverCountry)
    : null;

  return (
    <div className="space-y-5">
      {/* ── TASLAK DEVAM BANNER ── */}
      {showDraftBanner && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 sm:p-5 ring-1 ring-amber-200 shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">
          {/* Dekoratif arka plan */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/20" />
          <div className="pointer-events-none absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-orange-200/20" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Sol: Bilgi */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-slate-900">Yarım kalan bir gönderiniz var</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  {pendingDraft?.shipmentType && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      <Package className="h-3 w-3 text-amber-500" />
                      {pendingDraft.shipmentType}
                    </span>
                  )}
                  {draftCountryLabel && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      <MapPin className="h-3 w-3 text-amber-500" />
                      {draftCountryLabel}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    <Clock className="h-3 w-3 text-amber-500" />
                    Adım: {draftStepLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Sağ: Butonlar */}
            <div className="flex items-center gap-2 sm:shrink-0">
              <Button
                type="button"
                variant="secondary"
                onClick={dismissDraftBanner}
                className="gap-1.5 text-sm text-slate-600 hover:text-slate-800"
              >
                <X className="h-3.5 w-3.5" />
                Kapat
              </Button>
              <Button
                type="button"
                onClick={resumeFromDraft}
                disabled={draftLoading}
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                {draftLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Taslaktan Devam Et
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="text-lg font-semibold tracking-tight">Gönderi Oluştur</div><div className="mt-1 text-sm text-muted">6 adımda gönderini hazırla. Taslak otomatik kaydedilir.</div></div>
        {selectedQuote ? <Badge className="w-fit">{selectedQuote.carrierName} · {getCurrencySymbol(selectedQuote.currency)}{selectedQuote.price.toFixed(2)} ({selectedQuote.priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺)</Badge> : <Badge className="w-fit">Kargo seçilmedi</Badge>}
      </div>

      <Stepper
        steps={[...STEPS]}
        current={step}
        onStepClick={(idx) => {
          if (idx < step) {
            // Belge tipinde step 1'e (Paket Ölçüleri) tıklanmasını engelle
            if (idx === 1 && draft.shipmentType === "Belge") return;
            setStep(idx);
            setDone(false);
            setApiError(null);
          }
        }}
      />

      <Card>
        {/* ── Card Header ── */}
        {step === 0 ? (
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Kargo Bilgileri</CardTitle>
              <p className="mt-1 text-sm text-muted font-medium">Gönderi tipi ve alıcı bilgilerini belirleyin.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-muted">
              <Save className="h-4 w-4" />
              <span>Taslak kaydediliyor</span>
            </div>
          </CardHeader>
        ) : step === 1 ? (
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Paket Ölçüleri</CardTitle>
              <p className="mt-1 text-sm text-muted">Kayıtlı ölçülerden seçebilir veya ölçüleri manuel girebilirsiniz.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={back} className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-bold text-[#0F172A] transition-colors shadow-sm">
                <span>←</span> Geri
              </button>
              <button type="button" onClick={next} disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#3959F2] hover:bg-[#4338CA] px-4 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-bold text-white transition-colors disabled:opacity-50">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Devam <span>→</span>
              </button>
            </div>
          </CardHeader>
        ) : (
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{STEPS[step]}</CardTitle>
            {step < STEPS.length - 1 && (
              <div className="flex flex-col items-end gap-1">
                {apiError && <p className="text-xs text-red-500 font-medium">{apiError}</p>}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={back} disabled={step === 0 || loading} className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-bold text-[#0F172A] transition-colors shadow-sm disabled:opacity-40">
                    <span>←</span> Geri
                  </button>
                  {step !== 3 && (
                    <button type="button" onClick={next} disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#3959F2] hover:bg-[#4338CA] px-4 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-bold text-white transition-colors disabled:opacity-50">
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Devam <span>→</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </CardHeader>
        )}

        <CardContent>
          {/* ===== STEP 0 — Kargo Bilgileri ===== */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              {/* ── Gönderi Tipi ── */}
              <div>
                <div className="mb-2.5 text-[13px] font-bold text-[#0F172A]">Gönderi Tipi</div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["Belge", "Paket", "Koli"] as const).map((typeName) => {
                    const meta = SHIPMENT_TYPE_META[typeName];
                    const isActive = draft.shipmentType === typeName;
                    return (
                      <button
                        key={typeName}
                        type="button"
                        onClick={() => update("shipmentType", typeName as any)}
                        className={cn(
                          "relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all duration-200",
                          isActive
                            ? "bg-[#3959F2] text-white shadow-lg shadow-[#4F46E5]/25"
                            : "bg-[#F8FAFC] text-[#0F172A] ring-1 ring-[#E2E8F0] hover:ring-[#CBD5E1] hover:shadow-sm"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-bold">{typeName}</div>
                          <div className={cn("mt-0.5 text-[11px] font-medium", isActive ? "text-white/75" : "text-[#94A3B8]")}>{meta.description}</div>
                        </div>
                        <div className="ml-2 shrink-0">
                          <img src={`/${typeName.toLowerCase()}.png`} alt={typeName} className="drop-shadow-sm h-10 w-10 object-contain" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Gönderici Ülke + Alıcı Ülke + Posta Kodu (3 kolon) ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gönderici Ülke */}
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Gönderici Ülke <span className="text-red-500">*</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 ring-1 ring-border h-10">
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 overflow-hidden rounded-sm shadow-sm ring-1 ring-border h-5 w-7 relative">
                        <img src="https://flagcdn.com/w40/tr.png" alt="Türkiye" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[13px] font-bold text-foreground">Türkiye</div>
                    </div>
                    <span className="text-[10px] font-medium text-muted">Sabit</span>
                  </div>
                </div>

                {/* Alıcı Ülke */}
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Alıcı Ülke <span className="text-red-500">*</span>
                  </div>
                  <div className="rounded-xl ring-1 ring-border bg-surface">
                    <SearchableSelect
                      options={apiCountries.length > 0 ? apiCountries : RECEIVER_COUNTRIES.map((c) => ({ ...c, label: (<div className="flex items-center gap-2"><CountryFlag code={c.value} size="sm" /><span>{c.label}</span></div>) as any, searchableText: c.label }))}
                      value={draft.receiverCountry}
                      onChange={(v) => { update("receiverCountry", v); update("receiverPostalCode", ""); }}
                      placeholder="Ülke Seçiniz"
                      className="h-10 border-0 ring-0 focus:ring-0 bg-transparent text-[13px] px-3"
                    />
                  </div>
                </div>

                {/* Alıcı Posta Kodu */}
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Posta Kodu / Şehir <span className="text-red-500">*</span>
                  </div>
                  <div className="relative rounded-xl ring-1 ring-border bg-surface overflow-hidden">
                    <Input
                      value={draft.receiverPostalCode}
                      onChange={(e) => update("receiverPostalCode", e.target.value)}
                      placeholder="Örn: 10115"
                      disabled={!draft.receiverCountry}
                      className="h-10 border-0 ring-0 focus:ring-0 focus-visible:ring-0 shadow-none bg-transparent text-[13px] pr-8 disabled:opacity-100"
                    />
                    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Footer: zorunlu alanlar + buttons ── */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-[12px] text-muted">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>Zorunlu alanlar <span className="text-red-500 font-semibold">*</span> ile işaretlidir.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={back} disabled={step === 0} className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-2 text-[13px] font-bold text-[#0F172A] transition-colors shadow-sm disabled:opacity-40">
                    <span>←</span> Geri
                  </button>
                  <button type="button" onClick={next} className="flex items-center gap-2 rounded-xl bg-[#3959F2] hover:bg-[#4338CA] px-5 py-2 text-[13px] font-bold text-white transition-colors">
                    Devam <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 1 — Paket Ölçüleri ===== */}
          {step === 1 && (
            <div className="flex flex-col gap-6 pb-24">
              <div className="space-y-5">
                {draft.packages.map((pkg, idx) => {
                  const pw = Math.max(toNumber(pkg.widthCm), 0);
                  const pl = Math.max(toNumber(pkg.lengthCm), 0);
                  const ph = Math.max(toNumber(pkg.heightCm), 0);
                  const pkgVol = (pw * pl * ph) / 5000;
                  const pkgActual = Math.max(toNumber(pkg.weightKg), 0);
                  const pkgCount = Math.max(1, Math.round(toNumber(pkg.packageCount)));
                  const pkgChargeable = Math.max(pkgVol, pkgActual) * pkgCount;
                  const isVolHigher = pkgVol > pkgActual;

                  return (
                    <div key={pkg.id} className="rounded-2xl bg-white ring-1 ring-[#E2E8F0] overflow-hidden">
                      {/* Card header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-[#F1F5F9] gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1F5F9] text-[12px] font-bold text-[#475569]">{idx + 1}</span>
                          <span className="text-[14px] font-bold text-[#0F172A]">Paket/Koli {idx + 1}</span>
                          {pkgChargeable > 0 && (
                            <span className="text-[12px] text-[#94A3B8]">{pkgChargeable.toFixed(1)} kg</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="rounded-lg ring-1 ring-[#E2E8F0] overflow-hidden flex-1 sm:flex-initial">
                            <SearchableSelect
                              options={apiMeasurements.map(p => ({ label: `${p.label} (${p.widthCm}×${p.lengthCm}×${p.heightCm} cm, ${p.weightKg} kg)`, value: String(p.id) }))}
                              value={pkg.selectedPreset}
                              onChange={v => applyPresetToPackage(pkg.id, v as string)}
                              placeholder="Şablon seç"
                              className="h-9 border-0 ring-0 focus:ring-0 bg-transparent text-[12px] px-3 min-w-[120px]"
                              hideSearchAndSort={true}
                            />
                          </div>
                          {draft.packages.length > 1 && (
                            <button type="button" onClick={() => removePackageItem(pkg.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-red-50 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-4 sm:p-6">
                        <div className="flex gap-10">
                          {/* 3D Box illustration */}
                          <div className="hidden lg:flex flex-col items-center justify-center shrink-0" style={{ width: 280 }}>
                            <svg viewBox="0 0 250 240" width="260" height="240" className="drop-shadow-sm">
                              {/* Back face */}
                              <polygon points="60,50 180,50 180,170 60,170" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
                              {/* Top face */}
                              <polygon points="60,50 110,20 230,20 180,50" fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1.5" />
                              {/* Right face */}
                              <polygon points="180,50 230,20 230,140 180,170" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
                              {/* Dimension lines - Height */}
                              <line x1="40" y1="55" x2="40" y2="165" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 2" />
                              <line x1="35" y1="55" x2="45" y2="55" stroke="#3B82F6" strokeWidth="1" />
                              <line x1="35" y1="165" x2="45" y2="165" stroke="#3B82F6" strokeWidth="1" />
                              <rect x="12" y="95" width="56" height="24" rx="6" fill="white" stroke="#3B82F6" strokeWidth="1" />
                              <text x="40" y="112" textAnchor="middle" fontSize="11" fontWeight="600" fill="#3B82F6">{pkg.heightCm || "0"} cm</text>
                              <text x="40" y="185" textAnchor="middle" fontSize="10" fill="#94A3B8">yükseklik</text>
                              {/* Dimension lines - Width */}
                              <line x1="65" y1="185" x2="175" y2="185" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 2" />
                              <line x1="65" y1="180" x2="65" y2="190" stroke="#3B82F6" strokeWidth="1" />
                              <line x1="175" y1="180" x2="175" y2="190" stroke="#3B82F6" strokeWidth="1" />
                              <rect x="92" y="193" width="56" height="24" rx="6" fill="white" stroke="#3B82F6" strokeWidth="1" />
                              <text x="120" y="210" textAnchor="middle" fontSize="11" fontWeight="600" fill="#3B82F6">{pkg.widthCm || "0"} cm</text>
                              <text x="120" y="228" textAnchor="middle" fontSize="10" fill="#94A3B8">genişlik</text>
                              {/* Dimension lines - Depth (boy) */}
                              <rect x="178" y="175" width="56" height="24" rx="6" fill="white" stroke="#10B981" strokeWidth="1" />
                              <text x="206" y="192" textAnchor="middle" fontSize="11" fontWeight="600" fill="#10B981">{pkg.lengthCm || "0"} cm</text>
                              <text x="206" y="210" textAnchor="middle" fontSize="10" fill="#94A3B8">uzunluk</text>
                            </svg>
                          </div>

                          {/* Input fields */}
                          <div className="flex-1 min-w-0">
                            {/* Row 1: Genişlik, Uzunluk, Yükseklik */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                              <div>
                                <div className="mb-1.5 text-[11px] font-semibold text-[#64748B]">Genişlik</div>
                                <div className="flex items-center rounded-lg ring-1 ring-[#E2E8F0] bg-[#F8FAFC] overflow-hidden focus-within:ring-[#3B82F6] transition-colors">
                                  <span className="pl-2.5 text-[#94A3B8]"><Ruler className="h-3.5 w-3.5" /></span>
                                  <Input inputMode="decimal" value={pkg.widthCm} onChange={e => { const v = e.target.value.replace(",", "."); if (/^\d*\.?\d*$/.test(v)) updatePackageItem(pkg.id, "widthCm", v); }} placeholder="0" className="h-10 text-[14px] font-semibold border-0 ring-0 focus:ring-0 focus-visible:ring-0 shadow-none bg-transparent px-2" />
                                  <span className="pr-2.5 text-[11px] text-[#94A3B8] shrink-0">cm</span>
                                </div>
                              </div>
                              <div>
                                <div className="mb-1.5 text-[11px] font-semibold text-[#64748B]">Uzunluk</div>
                                <div className="flex items-center rounded-lg ring-1 ring-[#E2E8F0] bg-[#F8FAFC] overflow-hidden focus-within:ring-[#3B82F6] transition-colors">
                                  <span className="pl-2.5 text-[#94A3B8]"><Ruler className="h-3.5 w-3.5 rotate-90" /></span>
                                  <Input inputMode="decimal" value={pkg.lengthCm} onChange={e => { const v = e.target.value.replace(",", "."); if (/^\d*\.?\d*$/.test(v)) updatePackageItem(pkg.id, "lengthCm", v); }} placeholder="0" className="h-10 text-[14px] font-semibold border-0 ring-0 focus:ring-0 focus-visible:ring-0 shadow-none bg-transparent px-2" />
                                  <span className="pr-2.5 text-[11px] text-[#94A3B8] shrink-0">cm</span>
                                </div>
                              </div>
                              <div>
                                <div className="mb-1.5 text-[11px] font-semibold text-[#64748B]">Yükseklik</div>
                                <div className="flex items-center rounded-lg ring-1 ring-[#E2E8F0] bg-[#F8FAFC] overflow-hidden focus-within:ring-[#3B82F6] transition-colors">
                                  <span className="pl-2.5 text-[#94A3B8]"><Ruler className="h-3.5 w-3.5" /></span>
                                  <Input inputMode="decimal" value={pkg.heightCm} onChange={e => { const v = e.target.value.replace(",", "."); if (/^\d*\.?\d*$/.test(v)) updatePackageItem(pkg.id, "heightCm", v); }} placeholder="0" className="h-10 text-[14px] font-semibold border-0 ring-0 focus:ring-0 focus-visible:ring-0 shadow-none bg-transparent px-2" />
                                  <span className="pr-2.5 text-[11px] text-[#94A3B8] shrink-0">cm</span>
                                </div>
                              </div>
                            </div>
                            {/* Row 2: Ağırlık, Adet */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                              <div>
                                <div className="mb-1.5 text-[11px] font-semibold text-[#64748B]">Ağırlık</div>
                                <div className="flex items-center rounded-lg ring-1 ring-[#E2E8F0] bg-[#F8FAFC] overflow-hidden focus-within:ring-[#3B82F6] transition-colors">
                                  <span className="pl-2.5 text-[#94A3B8]"><Package className="h-3.5 w-3.5" /></span>
                                  <Input inputMode="decimal" value={pkg.weightKg} onChange={e => { const v = e.target.value.replace(",", "."); if (/^\d*\.?\d*$/.test(v)) updatePackageItem(pkg.id, "weightKg", v); }} placeholder="0" className="h-10 text-[14px] font-semibold border-0 ring-0 focus:ring-0 focus-visible:ring-0 shadow-none bg-transparent px-2" />
                                  <span className="pr-2.5 text-[11px] text-[#94A3B8] shrink-0">kg</span>
                                </div>
                              </div>
                              <div>
                                <div className="mb-1.5 text-[11px] font-semibold text-[#64748B]">Adet</div>
                                <div className="flex items-center rounded-lg ring-1 ring-[#E2E8F0] bg-[#F8FAFC] overflow-hidden focus-within:ring-[#3B82F6] transition-colors">
                                  <span className="pl-2.5 text-[#94A3B8]"><Package className="h-3.5 w-3.5" /></span>
                                  <Input inputMode="numeric" value={pkg.packageCount} onChange={e => { const v = e.target.value; if (/^\d*$/.test(v)) updatePackageItem(pkg.id, "packageCount", v); }} placeholder="1" className="h-10 text-[14px] font-semibold border-0 ring-0 focus:ring-0 focus-visible:ring-0 shadow-none bg-transparent px-2" />
                                  <span className="pr-2.5 text-[11px] text-[#94A3B8] shrink-0">adet</span>
                                </div>
                              </div>
                            </div>

                            {/* Weight comparison info */}
                            {(pw > 0 || pl > 0 || ph > 0 || pkgActual > 0) && (
                              <div className="rounded-xl bg-[#F8FAFC] ring-1 ring-[#E2E8F0] p-4">
                                <div className="flex items-center gap-2 mb-3 text-[13px] font-semibold text-[#475569]">
                                  <Package className="h-4 w-4 text-[#94A3B8]" />
                                  Kargo firmaları yüksek olan ağırlığı baz alır
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className={cn("rounded-xl p-3 ring-1", !isVolHigher ? "bg-white ring-[#10B981]/30" : "bg-white ring-[#E2E8F0]")}>
                                    <div className="text-[11px] text-[#94A3B8] mb-1 flex items-center gap-1.5">
                                      <Package className="h-3 w-3" /> Tartı Ağırlığı
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[18px] font-bold text-[#0F172A]">{(pkgActual * pkgCount).toFixed(1)} kg</span>
                                      {!isVolHigher && <CheckCircle2 className="h-5 w-5 text-[#10B981]" />}
                                    </div>
                                  </div>
                                  <div className={cn("rounded-xl p-3 ring-1", isVolHigher ? "bg-white ring-[#10B981]/30" : "bg-white ring-[#E2E8F0]")}>
                                    <div className="text-[11px] text-[#94A3B8] mb-1 flex items-center gap-1.5">
                                      <Ruler className="h-3 w-3" /> Hacimsel Ağırlık
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[18px] font-bold text-[#0F172A]">{(pkgVol * pkgCount).toFixed(1)} kg</span>
                                      {isVolHigher && <CheckCircle2 className="h-5 w-5 text-[#10B981]" />}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Save measurement */}
                        <div className="mt-4 flex items-center gap-2">
                          <button type="button" onClick={() => updatePackageItem(pkg.id, "saveMeasurement", !pkg.saveMeasurement)} className="flex items-center gap-2 group outline-none text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors">
                            <div className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors", pkg.saveMeasurement ? "bg-[#3959F2] border-[#4F46E5] text-white" : "border-[#CBD5E1] bg-white")}>
                              {pkg.saveMeasurement && <Check className="h-3 w-3" />}
                            </div>
                            Şablon olarak kaydet
                          </button>
                          {pkg.saveMeasurement && (
                            <Input value={pkg.measurementLabel || ""} onChange={(e) => updatePackageItem(pkg.id, "measurementLabel", e.target.value)} placeholder="Örn: Küçük Kutu" className="h-8 max-w-[200px] text-[12px] rounded-lg" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPackageExcel(true)}
                  className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-[#475569] ring-1 ring-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Excel ile Toplu Yükle
                </button>
                <button
                  type="button"
                  onClick={addPackageItem}
                  className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white bg-[#3959F2] hover:bg-[#4338CA] transition-colors"
                >
                  <Plus className="h-4 w-4" /> Farklı Ölçüde Koli Ekle
                </button>
              </div>

              {/* Sticky bottom bar */}
        {/* Sticky bottom bar */}
              <div className="sticky bottom-4 z-40 pointer-events-none mt-auto">
                <div className="pointer-events-auto bg-[#0F172A] text-white shadow-2xl rounded-2xl">
                  <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="flex items-center justify-between sm:block">
                      <div className="text-[13px] sm:text-[14px] font-bold">Genel Toplam</div>
                      <div className="text-[11px] sm:text-[12px] text-[#94A3B8]">
                        {totalPackageCount} koli • {chargeableWeight.toFixed(1)} kg
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:gap-6">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] sm:text-[11px] text-[#94A3B8]">Ücretlendirme</div>
                        <div className="text-[18px] sm:text-[24px] font-bold leading-tight">{chargeableWeight.toFixed(1)}kg</div>
                      </div>
                      <button type="button" onClick={next} disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#3959F2] hover:bg-[#4338CA] px-4 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-bold text-white transition-colors disabled:opacity-50">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Sonraki Adım <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 2 — Fiyatlandırma ===== */}
          {step === 2 && (() => {
            const topCarrierIds = new Set<string>();
            if (recommendedQ) topCarrierIds.add(recommendedQ.carrierId);
            if (fastestQ) topCarrierIds.add(fastestQ.carrierId);
            if (cheapestQ) topCarrierIds.add(cheapestQ.carrierId);
            const otherCarriers = apiQuotes.filter((q, i, arr) => arr.findIndex(x => x.carrierId === q.carrierId) === i && !topCarrierIds.has(q.carrierId));
            const sym = selectedQuote ? getCurrencySymbol(selectedQuote.currency) : "$";
            const uniqueQuotes = apiQuotes.filter((q, i, arr) => arr.findIndex(x => x.carrierId === q.carrierId) === i);

            const renderCarrierRow = (q: ApiCarrierQuote) => {
              const isSelected = draft.selectedCarrierId === q.carrierId;
              const logoColor = getLogoColor(q);
              const qSym = getCurrencySymbol(q.currency);
              return (
                <button key={q.carrierId} type="button" onClick={() => update("selectedCarrierId", q.carrierId)} className={cn("group flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left ring-1 transition-all", isSelected ? "bg-white ring-2 ring-[#4F46E5] shadow-sm" : "bg-white ring-[#E2E8F0] hover:ring-[#CBD5E1] hover:shadow-sm")}>
                  <div className="flex items-center gap-4 min-w-0">
<CarrierLogo q={q} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-[#0F172A]">{q.carrierName}</span>
                        <span className="text-[12px] text-[#94A3B8]">{q.serviceName}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
                        <Clock className="h-3 w-3" /> Teslimat: <span className="font-medium text-[#475569]">{q.deliveryLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-[18px] font-bold text-[#0F172A]">{qSym}{q.price.toFixed(2)}</div>
                      <div className="text-[11px] text-[#94A3B8]">≈ ₺{q.priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                    </div>
                    <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 transition-colors", isSelected ? "bg-[#3959F2] ring-[#4F46E5] text-white" : "bg-white ring-[#CBD5E1] group-hover:ring-[#94A3B8]")}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              );
            };

       const renderTaggedCarrier = (q: ApiCarrierQuote, tagLabel: string, tagColor: string, headerBg: string, borderColor: string, cardRing: string, TagIcon: any, showBestLabel?: boolean) => {
  const isSelected = draft.selectedCarrierId === q.carrierId;
  const qSym = getCurrencySymbol(q.currency);
  return (
    <button key={q.carrierId} type="button" onClick={() => update("selectedCarrierId", q.carrierId)} className={cn("group w-full text-left rounded-2xl ring-1 overflow-hidden transition-all", isSelected ? "bg-white ring-1 shadow-sm ring-[#4F46E5]" : cn("bg-white hover:shadow-sm", cardRing))}>
      {/* Tag header */}
      <div className={cn("flex items-center justify-between border-b px-5 pt-3 pb-2", headerBg, borderColor)}>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1", tagColor)}>
          <TagIcon className="h-3 w-3" />{tagLabel}
        </span>
        {showBestLabel && <span className="text-[11px] font-medium flex items-center gap-1 text-[#6366F1]"><Star className="h-3 w-3" /> En iyi fiyat / performans</span>}
      </div>
      {/* Content */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-4 min-w-0">
          
          {/* 🚀 DEĞİŞEN TEK SATIR BURASI: Manuel div yerine CarrierLogo component'ini çağırdık 🚀 */}
          <CarrierLogo q={q} />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-[#0F172A]">{q.carrierName}</span>
              <span className="text-[12px] text-[#94A3B8]">{q.serviceName}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
              <Clock className="h-3 w-3" /> Teslimat: <span className="font-medium text-[#475569]">{q.deliveryLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[18px] font-bold text-[#0F172A]">{qSym}{q.price.toFixed(2)}</div>
            <div className="text-[11px] text-[#94A3B8]">≈ ₺{q.priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          </div>
          <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 transition-colors", isSelected ? "bg-[#3959F2] ring-[#4F46E5] text-white" : "bg-white ring-[#CBD5E1] group-hover:ring-[#94A3B8]")}>
            {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
          </div>
        </div>
      </div>
    </button>
  );
};

            return (
              <div className="space-y-5 pb-24">
                <RouteSummaryBar senderCountry={draft.senderCountry} senderName={apiCountries.find(x => x.value === draft.senderCountry)?.name} senderFlag={apiCountries.find(x => x.value === draft.senderCountry)?.flag} receiverCountry={draft.receiverCountry} chargeableWeight={chargeableWeight} receiverName={apiCountries.find(x => x.value === draft.receiverCountry)?.name} receiverFlag={apiCountries.find(x => x.value === draft.receiverCountry)?.flag} />

                {/* Header */}
                <div>
                  <button type="button" onClick={back} className="flex items-center gap-1 text-[12px] text-[#94A3B8] hover:text-[#475569] mb-2 transition-colors">← Geri Dön</button>
                  <div className="flex items-center gap-3">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">Kargo Seçenekleri</h2>
                    {uniqueQuotes.length > 0 && <span className="text-[13px] text-[#94A3B8]">{uniqueQuotes.length} fiyat teklifi</span>}
                  </div>
                </div>

                {/* Empty state */}
                {apiQuotes.length === 0 && quotesMessage && (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-amber-50 p-8 text-center ring-1 ring-amber-200">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Info className="h-7 w-7" /></div>
                    <div>
                      <div className="text-sm font-semibold text-amber-800">{quotesMessage}</div>
                      <p className="mt-1 text-xs text-amber-600">Farklı bir rota veya paket bilgisi ile tekrar deneyebilirsiniz.</p>
                    </div>
                  </div>
                )}

                {/* Top tagged carriers */}
                {apiQuotes.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {recommendedQ && renderTaggedCarrier(
                      recommendedQ,
                      "Tavsiye Edilen",
                      "bg-white text-[#6366F1] ring-[#6366F1]/30",
                      "bg-[#F5F3FF]",
                      "border-[#6366F1]",
                      "ring-[#6366F1]",
                      Star,
                      true
                    )}
                    {fastestQ && fastestQ.carrierId !== recommendedQ?.carrierId && renderTaggedCarrier(
                      fastestQ,
                      "En Hızlı",
                      "bg-white text-[#F59E0B] ring-[#F59E0B]/30",
                      "bg-[#FEFCE8]",
                      "border-[#F59E0B]",
                      "ring-[#F59E0B]/30",
                      Zap
                    )}
                    {cheapestQ && cheapestQ.carrierId !== recommendedQ?.carrierId && cheapestQ.carrierId !== fastestQ?.carrierId && renderTaggedCarrier(
                      cheapestQ,
                      "En Uygun",
                      "bg-white text-[#10B981] ring-[#10B981]/30",
                      "bg-[#ECFDF5]",
                      "border-[#10B981]",
                      "ring-[#10B981]/30",
                      BadgeDollarSign
                    )}
                  </div>
                )}

                {/* Other carriers - shown by default */}
                {otherCarriers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-px bg-[#E2E8F0]" />
                      <button type="button" onClick={() => setShowMoreCarriers(!showMoreCarriers)} className="flex items-center gap-2 text-[13px] font-semibold text-[#475569] hover:text-[#0F172A] transition-colors">
                        Diğer Seçenekler ({otherCarriers.length})
                        <svg className={cn("h-4 w-4 transition-transform", showMoreCarriers && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                      <div className="flex-1 h-px bg-[#E2E8F0]" />
                    </div>
                    {showMoreCarriers && (
                      <div className="flex flex-col gap-3">
                        {otherCarriers.map(q => renderCarrierRow(q))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sticky bottom bar - right side only */}
             {/* Sticky bottom bar - right side only */}
                {selectedQuote && (
                  <div className="sticky bottom-4 z-40 pointer-events-none mt-auto">
                    <div className="pointer-events-auto bg-[#0F172A] text-white shadow-2xl rounded-2xl">
                      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0">
                            <div className="text-[13px] sm:text-[14px] font-bold truncate">{selectedQuote.carrierName} – {selectedQuote.serviceName}</div>
                            <div className="text-[11px] sm:text-[12px] text-[#94A3B8] flex items-center gap-1.5"><Clock className="h-3 w-3" /> {selectedQuote.deliveryLabel}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:gap-6">
                          <div className="text-left sm:text-right">
                            <div className="text-[18px] sm:text-[22px] font-bold leading-tight">{sym}{selectedQuote.price.toFixed(2)}</div>
                            <div className="text-[10px] sm:text-[11px] text-[#94A3B8]">≈ ₺{selectedQuote.priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}</div>
                          </div>
                          <button type="button" onClick={next} disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-4 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-bold text-white transition-colors disabled:opacity-50 shrink-0">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Devam <span>→</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ===== STEP 3 ===== */}
          {/* ===== STEP 3 — Adres Seçimi ===== */}
          {step === 3 && (() => {
            const selectedSender = SAVED_SENDER_ADDRESSES.find(a => String(a.id) === draft.selectedSenderAddressId);
            const selectedReceiver = SAVED_RECEIVER_ADDRESSES.find(a => String(a.id) === draft.selectedReceiverAddressId);
            const hasSender = !!draft.selectedSenderAddressId || !!draft.senderName;
            const hasReceiver = !!draft.selectedReceiverAddressId || !!draft.receiverName;
            const senderLabel = selectedSender?.name || draft.senderName || "";
            const receiverLabel = selectedReceiver?.name || draft.receiverName || "";
            const senderCompanyLabel = selectedSender?.company || draft.senderCompany || "";
            const receiverCompanyLabel = selectedReceiver?.company || draft.receiverCompany || "";
            const senderCityLabel = selectedSender?.city || draft.senderCity || "";
            const receiverCityLabel = selectedReceiver?.city || draft.receiverCity || "";

            return (
              <div className="space-y-3 pb-20">
                {/* Header */}
                <div>
                  <h2 className="text-[16px] font-bold text-[#0F172A]">Adres Bilgileri</h2>
                  <p className="text-[12px] text-[#94A3B8] mt-0.5">Gönderen ve alıcı adreslerini seçin veya yeni ekleyin.</p>
                </div>

                {/* Tabs */}
                <div className="flex rounded-lg overflow-hidden ring-1 ring-[#E2E8F0]">
                  <button type="button" onClick={() => setAddressTab("sender")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold transition-colors", addressTab === "sender" ? "bg-[#0F172A] text-white" : "bg-white text-[#64748B] hover:bg-[#F8FAFC]")}>
                    {hasSender ? <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="h-2 w-2 text-white" /></div> : <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">1</span>}
                    Gönderici
                  </button>
                  <button type="button" onClick={() => setAddressTab("receiver")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold transition-colors", addressTab === "receiver" ? "bg-[#0F172A] text-white" : "bg-white text-[#64748B] hover:bg-[#F8FAFC]")}>
                    {hasReceiver ? <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="h-2 w-2 text-white" /></div> : <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">2</span>}
                    Alıcı
                  </button>
                </div>

                {/* ===== Gönderici Tab ===== */}
                {addressTab === "sender" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[14px] font-semibold text-[#0F172A]">Kayıtlı Gönderici Adresleriniz</div>
                      <button type="button" onClick={() => { setShowNewSenderForm(!showNewSenderForm); if (!showNewSenderForm) update("selectedSenderAddressId", ""); }} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors">
                        <Plus className="h-3.5 w-3.5" />Yeni Gönderici Adresi Ekle
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
                      <Input value={senderSearch} onChange={e => setSenderSearch(e.target.value)} placeholder="İsim veya adres ile arayın..." className="pl-9 h-9 rounded-lg ring-1 ring-[#E2E8F0] border-0 bg-white text-[12px]" />
                    </div>

                    {!showNewSenderForm && (filteredSenderAddresses.length > 0
                      ? <div className="flex flex-col gap-2">
                          {filteredSenderAddresses.map(a => {
                            const isSelected = draft.selectedSenderAddressId === String(a.id);
                            return (
                              <button key={String(a.id)} type="button" onClick={() => { update("selectedSenderAddressId", String(a.id)); setShowNewSenderForm(false); }} className={cn("group flex w-full items-center justify-between rounded-xl p-3 text-left ring-1 transition-all", isSelected ? "bg-white ring-2 ring-[#4F46E5] shadow-sm" : "bg-white ring-[#E2E8F0] hover:ring-[#CBD5E1] hover:shadow-sm")}>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]">
                                    <User className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="text-[13px] font-bold text-[#0F172A]">{a.name}</div>
                                    <div className="text-[11px] text-[#94A3B8]">{a.company && <>{a.company} · </>}{a.city} · {a.address}</div>
                                  </div>
                                </div>
                                <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 transition-colors", isSelected ? "bg-[#3959F2] ring-[#4F46E5]" : "bg-white ring-[#CBD5E1] group-hover:ring-[#94A3B8]")}>
                                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      : <div className="rounded-xl bg-[#F8FAFC] p-4 text-center text-[12px] text-[#94A3B8] ring-1 ring-[#E2E8F0]">{senderSearch ? "Arama kriterlerinize uygun kayıtlı gönderici adresi bulunamadı." : "Kayıtlı gönderici adresiniz bulunmamaktadır."}</div>
                    )}

                    {showNewSenderForm && (
                      <div className="rounded-xl bg-white p-4 ring-1 ring-[#E2E8F0]">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="text-[13px] font-semibold text-[#0F172A]">Yeni Gönderici Adresi</div>
                          <button type="button" onClick={() => setShowNewSenderForm(false)} className="text-[12px] font-medium text-[#94A3B8] hover:text-[#475569]">İptal</button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Ad Soyad" icon={User}><Input value={draft.senderName} onChange={e => update("senderName", e.target.value)} placeholder="Gönderici adı soyadı" /></Field>
                          <Field label="Firma Adı" icon={Building}><Input value={draft.senderCompany} onChange={e => update("senderCompany", e.target.value)} placeholder="Firma adı (opsiyonel)" /></Field>
                          <Field label="Telefon" icon={Phone}><Input value={draft.senderPhone} onChange={e => { let v = e.target.value; if (!v.startsWith("+90")) v = "+90" + v.replace(/^\+?9?0?/, ""); update("senderPhone", v); }} placeholder="+90 5XX XXX XX XX" /></Field>
                          <Field label="Şehir" icon={MapPin}>
                            <CitySelect
                              countryCode={draft.senderCountry || "TR"}
                              value={draft.senderCity}
                              onChange={(v) => update("senderCity", v)}
                              placeholder="Şehir seçiniz"
                              className="h-10 border-0 ring-0 focus:ring-0 bg-transparent text-sm px-2"
                            />
                          </Field>
                          <div className="sm:col-span-2"><Field label="Açık Adres" icon={MapPinned}><Input value={draft.senderAddress} onChange={e => update("senderAddress", e.target.value)} placeholder="Sokak, cadde, bina no, daire no..." /></Field></div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button type="button" variant={draft.saveSenderAddress ? "primary" : "secondary"} onClick={() => update("saveSenderAddress", !draft.saveSenderAddress)}
                            className={cn("gap-2 transition-all", draft.saveSenderAddress && "bg-brand-600 text-white hover:bg-brand-700 border-none ring-0 focus-visible:ring-0")}>
                            {draft.saveSenderAddress ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {draft.saveSenderAddress ? "Gönderici Adresini Kaydet Seçildi" : "Gönderici Adresini Kaydet"}
                          </Button>
                        </div>
                      </div>
                    )}


                  </div>
                )}

                {/* ===== Alıcı Tab ===== */}
                {addressTab === "receiver" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[14px] font-semibold text-[#0F172A]">Kayıtlı Alıcı Adresleri</div>
                      <button type="button" onClick={() => { setShowNewReceiverForm(!showNewReceiverForm); if (!showNewReceiverForm) update("selectedReceiverAddressId", ""); }} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors">
                        <Plus className="h-3.5 w-3.5" />Yeni Alıcı Adresi Ekle
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
                      <Input value={receiverSearch} onChange={e => setReceiverSearch(e.target.value)} placeholder="İsim veya adres ile arayın..." className="pl-9 h-9 rounded-lg ring-1 ring-[#E2E8F0] border-0 bg-white text-[12px]" />
                    </div>

                    {!showNewReceiverForm && (filteredReceiverAddresses.length > 0
                      ? <div className="flex flex-col gap-2">
                          {filteredReceiverAddresses.map(a => {
                            const isSelected = draft.selectedReceiverAddressId === String(a.id);
                            return (
                              <button key={String(a.id)} type="button" onClick={() => { update("selectedReceiverAddressId", String(a.id)); setShowNewReceiverForm(false); }} className={cn("group flex w-full items-center justify-between rounded-xl p-3 text-left ring-1 transition-all", isSelected ? "bg-white ring-2 ring-[#4F46E5] shadow-sm" : "bg-white ring-[#E2E8F0] hover:ring-[#CBD5E1] hover:shadow-sm")}>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]">
                                    <User className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="text-[13px] font-bold text-[#0F172A]">{a.name}</div>
                                    <div className="text-[11px] text-[#94A3B8]">{a.company && <>{a.company} · </>}{a.city} · {a.address}</div>
                                  </div>
                                </div>
                                <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 transition-colors", isSelected ? "bg-[#3959F2] ring-[#4F46E5]" : "bg-white ring-[#CBD5E1] group-hover:ring-[#94A3B8]")}>
                                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      : <div className="rounded-xl bg-[#F8FAFC] p-4 text-center text-[12px] text-[#94A3B8] ring-1 ring-[#E2E8F0]">{receiverSearch ? "Arama kriterlerinize uygun kayıtlı alıcı adresi bulunamadı." : "Bu posta koduna kayıtlı alıcı adresiniz bulunmamaktadır."}</div>
                    )}

                    {showNewReceiverForm && (
                      <div className="rounded-xl bg-white p-4 ring-1 ring-[#E2E8F0]">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="text-[13px] font-semibold text-[#0F172A]">Yeni Alıcı Adresi</div>
                          <button type="button" onClick={() => setShowNewReceiverForm(false)} className="text-[12px] font-medium text-[#94A3B8] hover:text-[#475569]">İptal</button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Field label="Ad Soyad" icon={User}><Input value={draft.receiverName} onChange={e => update("receiverName", e.target.value)} placeholder="Alıcı adı soyadı" /></Field>
                          <Field label="Firma Adı" icon={Building}><Input value={draft.receiverCompany} onChange={e => update("receiverCompany", e.target.value)} placeholder="Firma adı (opsiyonel)" /></Field>
                          <Field label="Telefon" icon={Phone}>
                            <Input
                              value={draft.receiverPhone}
                              onChange={e => {
                                let v = e.target.value;
                                const country = apiCountries.find((c: any) => c.value === draft.receiverAddressCountry);
                                const prefix = country?.phoneCode || "";
                                if (prefix && !v.startsWith(prefix)) {
                                  v = prefix + v.replace(/^\+?\d{0,3}/, "");
                                }
                                update("receiverPhone", v);
                              }}
                              placeholder={(() => {
                                const country = apiCountries.find((c: any) => c.value === (draft.receiverAddressCountry || draft.receiverCountry));
                                return country?.phoneCode ? `${country.phoneCode} ...` : "Telefon";
                              })()}
                            />
                          </Field>
                          <Field label="Ülke" icon={MapPin}>
                            <SearchableSelect
                              options={apiCountries.length > 0 ? apiCountries : RECEIVER_COUNTRIES.map((c) => ({ ...c, label: (<div className="flex items-center gap-2"><span>{c.label}</span></div>) as any, searchableText: c.label }))}
                              value={draft.receiverAddressCountry}
                              onChange={(v) => {
                                update("receiverAddressCountry", v as string);
                                update("receiverStateProvince", "");
                                update("receiverAddressPostalCode", "");
                                // Ülke telefon kodunu otomatik doldur
                                const country = apiCountries.find((c: any) => c.value === v);
                                if (country?.phoneCode) {
                                  update("receiverPhone", country.phoneCode);
                                }
                              }}
                              placeholder="Ülke seçiniz"
                              className="h-10 border-0 ring-0 focus:ring-0 bg-transparent text-sm px-2"
                            />
                          </Field>
                          <Field label="Eyalet / Bölge" icon={MapPinned}>
                            <StateSelect
                              countryCode={draft.receiverAddressCountry}
                              value={draft.receiverStateProvince ?? ""}
                              onChange={(v) => update("receiverStateProvince", v)}
                              placeholder="Eyalet / Bölge seçiniz"
                              disabled={!draft.receiverAddressCountry}
                            />
                          </Field>
                          <Field label="Şehir" icon={MapPin}>
                            <CitySelect
                              countryCode={draft.receiverAddressCountry || draft.receiverCountry}
                              value={draft.receiverCity}
                              onChange={(v) => update("receiverCity", v)}
                              placeholder="Şehir seçiniz"
                              disabled={!draft.receiverAddressCountry && !draft.receiverCountry}
                            />
                          </Field>
                          <Field label="Posta Kodu" icon={MapPin}>
                            <Input value={draft.receiverAddressPostalCode ?? ""} onChange={e => update("receiverAddressPostalCode", e.target.value)} placeholder="Posta kodu (opsiyonel)" />
                          </Field>
                          <div className="sm:col-span-2"><Field label="Açık Adres" icon={MapPinned}><Input value={draft.receiverAddress} onChange={e => update("receiverAddress", e.target.value)} placeholder="Sokak, cadde, bina no, daire no..." /></Field></div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button type="button" variant={draft.saveReceiverAddress ? "primary" : "secondary"} onClick={() => update("saveReceiverAddress", !draft.saveReceiverAddress)}
                            className={cn("gap-2 transition-all", draft.saveReceiverAddress && "bg-brand-600 text-white hover:bg-brand-700 border-none ring-0 focus-visible:ring-0")}>
                            {draft.saveReceiverAddress ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {draft.saveReceiverAddress ? "Alıcı Adresini Kaydet Seçildi" : "Alıcı Adresini Kaydet"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Route summary strip */}
                <div className="flex items-center justify-between gap-2 rounded-xl bg-[#F8FAFC] ring-1 ring-[#E2E8F0] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]"><User className="h-3 w-3" /></div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-bold text-[#0F172A]">{senderLabel || "Seçilmedi"}</span>
                        <span className="text-[9px] font-semibold text-[#94A3B8] bg-[#F1F5F9] rounded px-1 py-0.5">Gönderici</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#CBD5E1] shrink-0" />
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-[9px] font-semibold text-[#94A3B8] bg-[#F1F5F9] rounded px-1 py-0.5">Alıcı</span>
                        <span className="text-[12px] font-bold text-[#0F172A]">{receiverLabel || "Henüz girilmedi"}</span>
                      </div>
                    </div>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]"><User className="h-3 w-3" /></div>
                  </div>
                </div>

         {/* Sticky bottom bar */}
                <div className="sticky bottom-3 z-40 pointer-events-none mt-auto">
                  <div className="pointer-events-auto bg-[#0F172A] text-white shadow-2xl rounded-xl">
                    <div className="flex items-center justify-between p-2.5 sm:p-3">
                      <div className="min-w-0">
                        <div className="text-[12px] sm:text-[13px] font-bold">Adres Seçimi</div>
                        <div className="text-[10px] sm:text-[11px] text-[#94A3B8] truncate">
                          {hasSender && <>Gönderici: <span className="font-semibold text-white">{senderLabel}</span></>}
                          {hasSender && hasReceiver && " • "}
                          {hasReceiver && <>Alıcı: <span className="font-semibold text-white">{receiverLabel}</span></>}
                        </div>
                      </div>
                      <button type="button" onClick={() => { if (addressTab === "sender") { setAddressTab("receiver"); } else { next(); } }} disabled={loading} className="flex items-center justify-center gap-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] px-4 py-2 text-[12px] sm:text-[13px] font-bold text-white transition-colors disabled:opacity-50 shrink-0">
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {addressTab === "sender" ? <>Alıcı Adresi <span>→</span></> : <>Devam <span>→</span></>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ===== STEP 4 ===== */}
          {step === 4 && (
            <div className="space-y-6 pb-24">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setStep(3)} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Geri Dön
                </button>
              </div>
              <div>
                <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Gümrük (Proforma) Beyanı</h2>
                <p className="mt-1 text-sm text-slate-500">Her kolinin boyut ve ağırlık bilgilerini girin.</p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-[#F8FAFC] p-4 text-sm text-slate-600">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-500 text-amber-500 bg-white">
                  <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
                </div>
                <div>
                  <span className="font-semibold text-slate-900">HS Kodu (GTİP) zorunludur</span><br />
                  <span className="text-[13px] text-slate-500">Eksik veya hatalı bilgiler gümrükte gecikmeye neden olabilir.</span>
                </div>
              </div>

              {/* Genel Bilgiler */}
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-[17px] font-bold text-slate-900 mb-6">Genel Bilgiler</div>
                <div className="grid gap-x-4 gap-y-5 grid-cols-1 sm:grid-cols-[2fr_1fr_1.5fr]">
                  {/* Gönderi İçeriği */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-bold text-slate-700 mt-1">Gönderi İçeriği <span className="text-red-500 text-sm ml-0.5">*</span></label>
                    <div className={cn("flex items-center h-[52px] rounded-2xl border-[1.5px] px-4 focus-within:bg-white focus-within:ring-2 transition-all", fieldErrors.proformaDescription ? "border-red-500 bg-red-50/30 ring-2 ring-red-100 focus-within:border-red-500 focus-within:ring-red-200" : "border-slate-300 bg-slate-50/50 focus-within:border-brand-500 focus-within:ring-brand-500/20")}>
                      <Box className="mr-3 h-4 w-4 text-slate-400 shrink-0" />
                      <SearchableSelect
                        options={descriptionTypes.map(dt => ({ label: dt.label, value: dt.label }))}
                        value={draft.proformaDescription}
                        onChange={v => update("proformaDescription", v as any)}
                        placeholder="Örn: Tekstil ürünleri, elektronik, aksesuar..."
                        className="flex-1 border-0 ring-0 shadow-none bg-transparent p-0 text-[14px] font-medium text-slate-700 focus:ring-0 placeholder:text-slate-400"
                        hideSearchAndSort
                      />
                    </div>
                  </div>

                  {/* Para Birimi */}
                  <div className="flex flex-col gap-2">
                     <label className="text-[12px] font-bold text-slate-700 mt-1">Para Birimi <span className="text-red-500 text-sm ml-0.5">*</span></label>
                     <div className={cn("flex h-[52px] items-center p-1.5 gap-1 rounded-2xl border-[1.5px] overflow-hidden", fieldErrors.proformaCurrency ? "border-red-500 bg-red-50/30 ring-2 ring-red-100" : "border-slate-300 bg-slate-50/50")}>
                      {(["EUR", "USD", "GBP"] as const).map((curr) => (
                        <button key={curr} type="button" onClick={() => update("proformaCurrency", curr)}
                          className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-[12px] h-full transition-all text-[13px] font-bold", draft.proformaCurrency === curr ? "bg-[#0B1527] text-white shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600")}>
                          <span className={cn("flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] border", draft.proformaCurrency === curr ? "border-white/20" : "border-slate-200 bg-white")}>
                            {curr === "EUR" ? "€" : curr === "USD" ? "$" : "£"}
                          </span>
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* IOSS/VAT */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-bold text-slate-700 mt-1">IOSS / VAT Numarası</label>
                    <div className={cn("flex items-center h-[52px] rounded-2xl border-[1.5px] px-4 focus-within:bg-white focus-within:ring-2 transition-all", fieldErrors.proformaIOSS ? "border-red-500 bg-red-50/30 ring-2 ring-red-100 focus-within:border-red-500 focus-within:ring-red-200" : "border-slate-300 bg-slate-50/50 focus-within:border-brand-500 focus-within:ring-brand-500/20")}>
                      <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full border border-slate-200 bg-[#F8FAFC] text-[11px] font-medium text-slate-500 shrink-0 mr-3">#</span>
                      <Input value={draft.proformaIOSS} onChange={e => update("proformaIOSS", e.target.value)} placeholder="Örn: IM0000000123 veya EU372000000" className="flex-1 border-0 ring-0 shadow-none bg-transparent p-0 text-[14px] font-medium text-slate-700 focus:ring-0 placeholder:text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      <span className="font-semibold text-slate-500">IOSS</span> (Import One-Stop Shop): Yalnızca <span className="font-semibold">AB ülkelerine</span> yapılan ve toplam değeri <span className="font-semibold">150€&apos;yu geçmeyen</span> gönderilerde kullanılır. AB dışı ülkelere (ABD, İngiltere vb.) yapılan gönderilerde bu alan boş bırakılabilir. VAT numaranız varsa da buraya girebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ürün Kalemleri Listesi */}
              <div className="space-y-4">
                {draft.proformaItems.map((item, idx) => (
                  <div key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                    {/* Üst Kısım: Sıra, Ürün İsmi, Row Toplamı ve Sil */}
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-slate-100 text-[14px] font-bold text-slate-600">{idx + 1}</div>
                        <div className="text-[17px] font-bold text-slate-900 flex items-center gap-3">
                          Ürün İsmi 
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">HS: {item.hsCode || "—"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-[18px] font-bold text-slate-900 mr-2">
                          {getCurrencySymbol(draft.proformaCurrency)}{(toNumber(item.quantity) * toNumber(item.unitPrice)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {draft.proformaItems.length > 1 && (
                          <button type="button" onClick={() => removeProformaItem(item.id)} className="text-red-500 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full">
                            <Trash2 className="h-[18px] w-[18px]" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-12">
                      {/* Row 1: Menşei, Ürün Adı, Miktar */}
                      
                      {/* Menşei */}
                      <div className="sm:col-span-12 lg:col-span-3 flex flex-col gap-2">
                        <label className="text-[12px] font-bold text-slate-700 mt-1">Menşei <span className="text-red-500 text-sm ml-0.5">*</span></label>
                        <div className={cn("flex items-center h-[52px] rounded-2xl border-[1.5px] px-4 focus-within:bg-white focus-within:ring-2 transition-all", fieldErrors[`item_${idx}_origin`] ? "border-red-500 bg-red-50/30 ring-2 ring-red-100 focus-within:border-red-500 focus-within:ring-red-200" : "border-slate-300 bg-slate-50/50 focus-within:border-brand-500 focus-within:ring-brand-500/20")}>
                          <Globe className="mr-3 h-4 w-4 text-slate-400 shrink-0" />
                          <SearchableSelect options={[{ label: "Türkiye", value: "TR" }]} value={item.origin} onChange={v => updateProformaItem(item.id, "origin", v)} hideSearchAndSort className="flex-1 border-0 ring-0 shadow-none bg-transparent p-0 text-[14px] font-medium text-slate-700 focus:ring-0" />
                        </div>
                      </div>

                      {/* Ürün Adı */}
                      <div className="sm:col-span-12 lg:col-span-7 flex flex-col gap-2">
                        <label className="text-[12px] font-bold text-slate-700 mt-1">Ürün Adı <span className="text-red-500 text-sm ml-0.5">*</span></label>
                        <div className={cn("flex items-center h-[52px] rounded-2xl border-[1.5px] px-4 focus-within:bg-white focus-within:ring-2 transition-all", fieldErrors[`item_${idx}_productName`] ? "border-red-500 bg-red-50/30 ring-2 ring-red-100 focus-within:border-red-500 focus-within:ring-red-200" : "border-slate-300 bg-slate-50/50 focus-within:border-brand-500 focus-within:ring-brand-500/20")}>
                          <Tag className="mr-3 h-4 w-4 text-slate-400 shrink-0" />
                          <Input value={item.productDescription} onChange={e => updateProformaItem(item.id, "productDescription", e.target.value)} placeholder="Zalusa Surprise Box" className="flex-1 border-0 ring-0 shadow-none bg-transparent p-0 text-[14px] font-medium text-slate-700 focus:ring-0 placeholder:text-slate-400" />
                        </div>
                      </div>

                      {/* Miktar */}
                      <div className="sm:col-span-12 lg:col-span-2 flex flex-col gap-2">
                         <label className="text-[12px] font-bold text-slate-700 mt-1">Miktar <span className="text-red-500 text-sm ml-0.5">*</span></label>
                         <div className={cn("flex items-center h-[52px] rounded-2xl border-[1.5px] px-4 focus-within:bg-white focus-within:ring-2 transition-all justify-between", fieldErrors[`item_${idx}_quantity`] ? "border-red-500 bg-red-50/30 ring-2 ring-red-100 focus-within:border-red-500 focus-within:ring-red-200" : "border-slate-300 bg-slate-50/50 focus-within:border-brand-500 focus-within:ring-brand-500/20")}>
                          <Input inputMode="numeric" value={item.quantity} onChange={e => updateProformaItem(item.id, "quantity", e.target.value)} placeholder="4" className="w-[40px] border-0 ring-0 shadow-none bg-transparent p-0 text-[15px] font-semibold text-slate-700 focus:ring-0" />
                          <div className="flex flex-col gap-[2px] border-l border-slate-100 pl-2">
                            <button type="button" onClick={() => updateProformaItem(item.id, "quantity", String(toNumber(item.quantity) + 1))} className="flex h-[18px] w-[24px] items-center justify-center rounded-[6px] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-500 transition-colors"><ChevronUp className="h-3 w-3" /></button>
                            <button type="button" onClick={() => updateProformaItem(item.id, "quantity", String(Math.max(1, toNumber(item.quantity) - 1)))} className="flex h-[18px] w-[24px] items-center justify-center rounded-[6px] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-500 transition-colors"><ChevronDown className="h-3 w-3" /></button>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: HS Kodu, SKU, Birim Fiyat */}

                      {/* HS Kodu */}
                      <div className="sm:col-span-12 lg:col-span-5 flex flex-col gap-2">
                        <label className="text-[12px] font-bold text-slate-700 mt-1">HS Kodu (GTİP) <span className="text-red-500 text-sm ml-0.5">*</span></label>
                        <div className={cn("flex items-center h-[52px] rounded-2xl border-[1.5px] px-4 focus-within:bg-white focus-within:ring-2 transition-all", fieldErrors[`item_${idx}_hsCode`] ? "border-red-500 bg-red-50/30 ring-2 ring-red-100 focus-within:border-red-500 focus-within:ring-red-200" : "border-slate-300 bg-slate-50/50 focus-within:border-brand-500 focus-within:ring-brand-500/20")}>
                          <span className="mr-3 font-medium text-slate-400 shrink-0">#</span>
                          <div className="flex-1 -ml-3">
                            <HSCodeCombobox value={item.hsCode} onChange={v => updateProformaItem(item.id, "hsCode", v)} productHint={item.productDescription} />
                          </div>
                        </div>
                      </div>

                       {/* SKU */}
                       <div className="sm:col-span-12 lg:col-span-5 flex flex-col gap-2">
                        <label className="text-[12px] font-medium text-slate-500">SKU</label>
                        <div className="flex items-center h-[52px] rounded-2xl border border-slate-200 px-4 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-shadow bg-white">
                          <Barcode className="mr-3 h-4 w-4 text-slate-400 shrink-0" />
                          <Input value={item.sku} onChange={e => updateProformaItem(item.id, "sku", e.target.value)} placeholder="Örn: Stok Kodu vb. (Opsiyonel)" className="flex-1 border-0 ring-0 shadow-none bg-transparent p-0 text-[14px] font-medium text-slate-700 focus:ring-0 placeholder:text-slate-400" />
                        </div>
                      </div>

                      {/* Birim Fiyat */}
                      <div className="sm:col-span-12 lg:col-span-2 flex flex-col gap-2">
                         <label className="text-[12px] font-bold text-slate-700 mt-1">Birim Fiyat ({getCurrencySymbol(draft.proformaCurrency)}) <span className="text-red-500 text-sm ml-0.5">*</span></label>
                         <div className={cn("flex items-center h-[52px] rounded-2xl border-[1.5px] px-4 focus-within:bg-white focus-within:ring-2 transition-all justify-between", fieldErrors[`item_${idx}_unitPrice`] ? "border-red-500 bg-red-50/30 ring-2 ring-red-100 focus-within:border-red-500 focus-within:ring-red-200" : "border-slate-300 bg-slate-50/50 focus-within:border-brand-500 focus-within:ring-brand-500/20")}>
                          <Input inputMode="decimal" value={item.unitPrice} onChange={e => updateProformaItem(item.id, "unitPrice", e.target.value)} placeholder="0.00" className="w-[60px] border-0 ring-0 shadow-none bg-transparent p-0 text-[15px] font-semibold text-slate-700 focus:ring-0" />
                          <div className="flex flex-col gap-[2px] border-l border-slate-100 pl-2">
                            <button type="button" onClick={() => updateProformaItem(item.id, "unitPrice", String(toNumber(item.unitPrice) + 1))} className="flex h-[18px] w-[24px] items-center justify-center rounded-[6px] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-500 transition-colors"><ChevronUp className="h-3 w-3" /></button>
                            <button type="button" onClick={() => updateProformaItem(item.id, "unitPrice", String(Math.max(0, toNumber(item.unitPrice) - 1)))} className="flex h-[18px] w-[24px] items-center justify-center rounded-[6px] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-500 transition-colors"><ChevronDown className="h-3 w-3" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowProformaExcel(true)} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                  <UploadCloud className="h-4 w-4" /> Excel ile Toplu Yükle
                </button>
                <button type="button" onClick={addProformaItem} className="flex items-center justify-center gap-2 rounded-xl bg-[#3959F2] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4338CA] transition-colors shadow-sm shadow-[#4F46E5]/20">
                  <Plus className="h-4 w-4" /> Yeni Ürün Ekle
                </button>
              </div>

              {/* ═══════════ GÜMRÜK BELGELERİ YÜKLEME ALANI ═══════════ */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileUp className="h-5 w-5 text-slate-500" />
                  <h3 className="text-[15px] font-semibold text-slate-800">Gümrük Belgeleri</h3>
                  <span className="text-[11px] text-slate-400 ml-1">(opsiyonel)</span>
                </div>

                {/* Belge Türü Seçici */}
                <div className="mb-3">
                  <label className="text-[12px] font-medium text-slate-500 mb-1.5 block">Belge Türü</label>
                  <div className="flex gap-2 flex-wrap">
                    {[{ value: "ETGB", label: "ETGB Belgesi" }, { value: "MSDS", label: "MSDS Belgesi" }, { value: "INVOICE", label: "Fatura" }, { value: "OTHER", label: "Diğer" }].map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setDocFileType(t.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all",
                          docFileType === t.value
                            ? "bg-[#3959F2] text-white border-[#3959F2] shadow-sm shadow-[#3959F2]/20"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sürükle-Bırak Yükleme Alanı */}
                <div
                  onDragOver={e => { e.preventDefault(); setDocDragOver(true); }}
                  onDragLeave={() => setDocDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDocDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) { setDocError(null); setDocSuccess(null); if (file.size > 25*1024*1024) { setDocError("Dosya boyutu 25MB'dan büyük olamaz."); return; } setDocUploadedFiles(prev => [...prev, { id: crypto.randomUUID(), name: file.name, type: docFileType, url: URL.createObjectURL(file), size: file.size, file: file }]); setDocSuccess(`"${file.name}" eklendi, gönderi tamamlanınca yüklenecek.`); setTimeout(() => setDocSuccess(null), 4000); } }}
                  onClick={() => !docUploading && docInputRef.current?.click()}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 cursor-pointer transition-all",
                    docDragOver
                      ? "border-[#3959F2] bg-[#3959F2]/5"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50",
                    docUploading && "pointer-events-none opacity-60"
                  )}
                >
                  <input ref={docInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp" onChange={e => { const file = e.target.files?.[0]; if (file) { setDocError(null); setDocSuccess(null); if (file.size > 25*1024*1024) { setDocError("Dosya boyutu 25MB'dan büyük olamaz."); return; } setDocUploadedFiles(prev => [...prev, { id: crypto.randomUUID(), name: file.name, type: docFileType, url: URL.createObjectURL(file), size: file.size, file: file }]); setDocSuccess(`"${file.name}" eklendi, gönderi tamamlanınca yüklenecek.`); setTimeout(() => setDocSuccess(null), 4000); } e.target.value = ""; }} />
                  {docUploading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-[#3959F2]" />
                      <p className="text-[13px] font-medium text-slate-600">Belge yükleniyor...</p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                        <UploadCloud className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] font-medium text-slate-700">Dosyayı sürükleyip bırakın veya <span className="text-[#3959F2] font-semibold">seçin</span></p>
                        <p className="text-[11px] text-slate-400 mt-1">PDF, DOC, XLS, JPG — maks. 25 MB</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Hata/Başarı Mesajları */}
                {docError && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-[12px] text-red-700 ring-1 ring-red-100">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {docError}
                  </div>
                )}
                {docSuccess && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-[12px] text-emerald-700 ring-1 ring-emerald-100">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    {docSuccess}
                  </div>
                )}

                {/* Yüklenen Dosyalar Listesi */}
                {docUploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Yüklenen Belgeler ({docUploadedFiles.length})</p>
                    {docUploadedFiles.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-100 shadow-sm">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50">
                          <FileIcon className="h-4 w-4 text-sky-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-slate-700 truncate">{f.name}</p>
                          <p className="text-[11px] text-slate-400">{f.type === "ETGB" ? "ETGB Belgesi" : f.type === "MSDS" ? "MSDS Belgesi" : f.type === "INVOICE" ? "Fatura" : "Diğer"} • {f.size < 1024 ? f.size + " B" : f.size < 1024*1024 ? (f.size/1024).toFixed(1) + " KB" : (f.size/(1024*1024)).toFixed(1) + " MB"}</p>
                        </div>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium text-sky-600 hover:text-sky-700 shrink-0">Görüntüle</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

         {/* Float Sticky Bottom Bar matching Figma */}
              <div className="sticky bottom-4 z-40 pointer-events-none mt-auto">
                <div className="pointer-events-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between rounded-2xl bg-[#161616] p-3 sm:p-4 text-white shadow-xl ring-1 ring-white/10 gap-3">
                  <div className="flex items-center justify-between sm:block">
                    <div className="flex items-center gap-2">
                      <div className="text-[13px] sm:text-[14px] font-bold">Gümrük Beyanı</div>
                    </div>
                    <div className="sm:mt-1 flex items-center gap-2 text-xs font-medium text-white/50">
                      <span>{draft.proformaItems.length} ürün</span>
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      <span>{draft.proformaItems.reduce((acc, val) => acc + (toNumber(val.quantity) || 1), 0)} birim</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:gap-6">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] sm:text-[11px] font-medium text-white/50">Toplam Değer</div>
                      <div className="text-[18px] sm:text-2xl font-bold leading-none tracking-tight">
                        {getCurrencySymbol(draft.proformaCurrency)}{proformaTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <button type="button" onClick={saveProformaDetails} className="flex h-[38px] sm:h-11 items-center gap-2 rounded-xl bg-[#3959F2] px-4 sm:px-6 text-[13px] sm:text-sm font-bold text-white shadow-lg shadow-[#4F46E5]/20 transition-all hover:bg-[#4338CA] shrink-0">
                      Devam <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 5 ===== */}
          {step === 5 && (
            <div className="flex flex-col items-center py-8">
              {!done ? (
                <div className="w-full max-w-[800px] animate-in fade-in duration-500 pb-16">
                  {/* Top Info */}
                  <div className="mb-6 flex flex-col gap-1">
                    <button type="button" onClick={() => setStep(4)} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600 w-fit mb-2 transition-colors">
                      <ArrowLeft className="h-3.5 w-3.5" /> Geri Dön
                    </button>
                    <h2 className="text-[28px] font-bold text-slate-800 tracking-tight">Gönderi Onayı</h2>
                    <p className="text-[14px] text-slate-500 font-medium">Bilgilerinizi gözden geçirin ve gönderiyi onaylayın.</p>
                  </div>

                  {/* Route Banner */}
                  <div className="w-full bg-[#1F2937] rounded-[16px] px-6 py-4 flex items-center justify-between mb-8 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10 w-1/3">
                        <img src={`https://flagcdn.com/w80/${(draft.senderCountry || "TR").toLowerCase()}.png`} alt="TR" className="w-[42px] h-[30px] rounded-[6px] object-cover ring-2 ring-white/10" />
                        <div className="flex flex-col">
                          <span className="text-[12px] font-medium text-white/50 relative -bottom-0.5">Çıkış</span>
                          <span className="text-[16px] font-bold text-white tracking-wide">{apiCountries.find(x => x.value === draft.senderCountry)?.name || COUNTRY_NAMES[draft.senderCountry] || "Türkiye"}</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                        <Plane className="w-5 h-5 text-white/50 mb-1" />
                        <span className="text-[11px] font-medium text-white/40">Kargo Ağırlığı <strong className="text-white/80 font-bold ml-1">{totalActualWeight.toFixed(2)} kg</strong></span>
                    </div>
                    
                    <div className="flex items-center gap-4 justify-end relative z-10 w-1/3">
                        <div className="flex flex-col items-end">
                          <span className="text-[12px] font-medium text-white/50 relative -bottom-0.5">Varış</span>
                          <span className="text-[16px] font-bold text-white tracking-wide">{apiCountries.find(x => x.value === draft.receiverCountry)?.name || COUNTRY_NAMES[draft.receiverCountry] || "İspanya"}</span>
                        </div>
                        <img src={`https://flagcdn.com/w80/${(draft.receiverCountry || "ES").toLowerCase()}.png`} alt="ES" className="w-[42px] h-[30px] rounded-[6px] object-cover ring-2 ring-white/10" />
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] p-6 sm:p-8 relative">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[18px] font-bold text-slate-800">Gönderi Detayları</h3>
                      <span className="text-[13px] font-medium text-slate-400 tracking-wide">Aşağıdaki bilgilerin doğruluğunu kontrol edin</span>
                    </div>

                    <div className="relative pb-16">
                        {/* Vertical Line */}
                        <div className="absolute left-[23px] top-[24px] bottom-[24px] w-[1px] bg-slate-100 z-0"></div>

                        {/* Timeline Items */}
                        <div className="flex flex-col gap-10">
                          
                          {/* Item 1: Tür */}
                          <div className="flex items-start gap-5 relative z-10">
                            <div className="w-[48px] h-[48px] rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm relative z-10">
                              <Package className="w-5 h-5 text-[#D97706]" strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col pt-1">
                              <span className="text-[12px] font-medium text-slate-400 mb-0.5">Gönderi Türü</span>
                              <span className="text-[15px] font-bold text-slate-800">{draft.shipmentType === 'Belge' ? 'Evrak / Belge' : 'Paket'}</span>
                            </div>
                          </div>

                          {/* Item 2: Fiyatlandırma */}
                          <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-start gap-5">
                              <div className="w-[48px] h-[48px] rounded-full bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center shrink-0 shadow-sm relative z-10">
                                <Box className="w-5 h-5 text-[#3B82F6]" strokeWidth={1.5} />
                              </div>
                              <div className="flex flex-col pt-1">
                                <span className="text-[12px] font-medium text-slate-400 mb-0.5">Ölçüler ve Fiyatlandırma</span>
                                <span className="text-[15px] font-bold text-slate-800">{totalVolumetricWeight > totalActualWeight ? totalVolumetricWeight.toFixed(1) : totalActualWeight.toFixed(1)} kg üzerinden ücretlendirme</span>
                              </div>
                            </div>
                            <div className="h-8 rounded-full border border-slate-200 bg-white px-3 flex items-center gap-1.5 shadow-sm mt-1">
                              <Box className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[12px] font-bold text-slate-600">{totalPackageCount} {draft.shipmentType.toLowerCase()}</span>
                            </div>
                          </div>

                          {/* Item 3: Kargo */}
                          <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-start gap-5">
                              <div className="w-[48px] h-[48px] rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm relative z-10 overflow-hidden p-[2px]">
                                {selectedQuote?.logoUrl ? <img src={getLogoSrc(selectedQuote.logoUrl)} className="w-[32px] h-[32px] object-contain rounded" /> : <span className="font-bold text-slate-700">{selectedQuote?.logoLetter}</span>}
                              </div>
                              <div className="flex flex-col pt-1">
                                <span className="text-[12px] font-medium text-slate-400 mb-0.5">Kargo Firması</span>
                                <span className="text-[15px] font-bold text-slate-800">{selectedQuote?.carrierName || "UPS"} — {selectedQuote?.serviceName || "Standard"}</span>
                              </div>
                            </div>
                            <div className="h-8 rounded-full border border-slate-200 bg-white px-3 flex items-center gap-1.5 shadow-sm mt-1">
                              <Plane className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[12px] font-bold text-slate-600">{selectedQuote?.deliveryLabel || "1-2 iş günü"}</span>
                            </div>
                          </div>

                          {/* Item 4: Gönderici -> Alıcı */}
                          <div className="flex items-start gap-5 relative z-10">
                            <div className="w-[48px] h-[48px] rounded-full bg-black flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.1)] relative z-10">
                              <ArrowRight className="w-5 h-5 text-white -rotate-45" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col pt-1">
                              <span className="text-[12px] font-medium text-slate-400 mb-0.5 flex items-center">Gönderici <ArrowRight className="w-3 h-3 mx-1 opacity-50" /> Alıcı</span>
                              <span className="text-[15px] font-bold text-slate-800 flex items-center">
                                {selectedSenderAddr?.label?.split(" ")[0] || draft.senderName?.split(" ")[0] || "Gönderici"} {selectedSenderAddr?.label?.split(" ")[1] || draft.senderName?.split(" ")[1] || ""}
                                <ArrowRight className="w-4 h-4 text-slate-400 mx-2" />
                                {draft.receiverName || "Alıcı"}
                              </span>
                            </div>
                          </div>
                          
                        </div>
                    </div>
                  </div>
                  
                  {/* Action Bar Float */}
                  <div className="bg-[#3B5FE5] w-full rounded-[16px] px-6 py-5 shadow-[0_12px_40px_-12px_rgba(59,95,229,0.7)] flex flex-col sm:flex-row items-center justify-between mt-[-56px] relative z-30">
                    <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
                      <div className="w-[42px] h-[42px] bg-white/10 rounded-xl border border-white/20 flex items-center justify-center backdrop-blur-sm p-1 shrink-0">
                        {selectedQuote?.logoUrl ? <img src={getLogoSrc(selectedQuote.logoUrl)} className="w-7 h-7 object-contain rounded" /> : <Package className="text-white w-5 h-5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-[15px] tracking-wide">{selectedQuote?.carrierName || "UPS"} - {selectedQuote?.serviceName || "Standart"}</span>
                        <div className="flex items-center gap-1.5 text-white/80 text-[12px] font-medium mt-0.5">
                          <Package className="w-3.5 h-3.5" /> Teslimat: <span className="font-bold text-white">{selectedQuote?.deliveryLabel || "1-2 iş günü"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-5 shrink-0 relative">
                      {apiError && <div className="absolute top-[-40px] right-0 text-red-500 font-bold text-sm bg-white px-3 py-1 rounded shadow-sm">{apiError}</div>}
                      <div className="text-[26px] font-black tracking-tighter text-white mb-0.5 leading-none">
                        {selectedQuote ? getCurrencySymbol(selectedQuote.currency) : "$"}{(selectedQuote?.price || 275.15).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <button 
                        type="button" 
                        onClick={finalize}
                        disabled={loading}
                        className="h-[44px] px-5 sm:px-6 bg-[#A3E635] hover:bg-[#84cc16] text-[#14532D] rounded-[12px] flex items-center gap-2 font-bold text-[14px] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_2px_10px_rgba(163,230,53,0.3)]"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Gönderiyi Oluştur <ArrowRight className="w-4 h-4 stroke-[2.5]" /></>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full pb-20 animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-center mb-6 sm:mb-8 px-4">
                    <h2 className="text-[24px] sm:text-[32px] font-bold text-slate-900 tracking-tight leading-tight mb-2">Gönderiniz Oluşturuldu!</h2>
                    <p className="text-[13px] sm:text-[14px] text-slate-500 font-medium max-w-[340px] mx-auto leading-relaxed">
                      Gönderiniz başarıyla oluşturuldu, gönderiniz ile ilgili bilgilere aşağıdan ulaşabilirsiniz.
                    </p>
                  </div>

                  {/* Kargo Fişi (Ticket) Modeli */}
                  <div className="relative w-full max-w-[480px] flex flex-col mb-8 font-sans">
                    
                    {/* Üst Kısım (Koyu) */}
                    <div className="bg-[#1A1A1A] rounded-t-[16px] px-6 py-4 flex items-center justify-between z-20">
                      <div className="flex items-center gap-3">
                        {selectedQuote?.logoUrl ? (
                          <img src={getLogoSrc(selectedQuote.logoUrl)} alt={selectedQuote.carrierName} className="h-6 object-contain" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-[#333] text-white text-[12px] font-bold">
                            {selectedQuote?.logoLetter || "U"}
                          </div>
                        )}
                        <span className="text-white text-[15px] font-medium tracking-wide">{selectedQuote?.carrierName || "UPS"} - {selectedQuote?.serviceName || "Standart"}</span>
                      </div>
                      <div className="border border-[#14532D] text-[#4ADE80] bg-transparent px-3 py-1 rounded-[6px] text-[12px] font-medium tracking-wide">
                        Onaylandı
                      </div>
                    </div>

                    {/* Alt Gövde (Açık Gri) */}
                    <div className="bg-[#F8F9FA] px-6 py-6 rounded-b-[16px] relative w-full overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-slate-200/50">
                      
                      {/* Tırtıklar (Scallops) */}
                      <div className="absolute left-[0px] top-[140px] bottom-[160px] w-3 flex flex-col justify-between -translate-x-2 z-10 py-1">
                        {[...Array(6)].map((_,i) => <div key={i} className="w-4 h-4 bg-white rounded-full shrink-0" />)}
                      </div>
                      <div className="absolute right-[0px] top-[140px] bottom-[160px] w-3 flex flex-col justify-between translate-x-2 z-10 py-1">
                        {[...Array(6)].map((_,i) => <div key={i} className="w-4 h-4 bg-white rounded-full shrink-0" />)}
                      </div>

                      {/* Rota Kartı */}
                      <div className="bg-white rounded-[16px] py-6 px-6 flex items-center justify-between mb-6 relative z-20 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-3">
                          <img src={`https://flagcdn.com/w40/${(draft.senderCountry || "TR").toLowerCase()}.png`} alt="TR" className="w-[30px] h-[22px] rounded object-cover shadow-sm ring-1 ring-slate-100" />
                          <span className="text-[32px] font-black text-slate-800 tracking-tighter uppercase leading-none">{draft.senderCountry || "IST"}</span>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center relative px-4">
                           <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-[1.5px] border-dashed border-slate-200"></div>
                           <div className="bg-white px-2 relative z-10 flex flex-col items-center gap-1.5">
                             <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center text-slate-500 ring-4 ring-white">
                               <Plane className="w-4 h-4 shadow-sm" />
                             </div>
                             <span className="text-[9px] font-bold text-slate-500 bg-white px-1 whitespace-nowrap">{selectedQuote?.deliveryLabel || "1-2 iş günü"}</span>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-[32px] font-black text-slate-800 tracking-tighter uppercase leading-none">{draft.receiverCountry || "ES"}</span>
                          <img src={`https://flagcdn.com/w40/${(draft.receiverCountry || "ES").toLowerCase()}.png`} alt={draft.receiverCountry || "ES"} className="w-[30px] h-[22px] rounded object-cover shadow-sm ring-1 ring-slate-100" />
                        </div>
                      </div>

                      {/* Horizontal Dashed Line */}
                      <div className="border-t-[1.5px] border-dashed border-slate-200/80 w-full mb-6 relative z-20"></div>

                      {/* Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-6 relative z-20">
                        <div className="bg-white rounded-[12px] p-4 flex flex-col gap-1 border border-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
                            <Calendar className="w-4 h-4" strokeWidth={1.5} /> Tarih
                          </div>
                          <div className="text-[14px] font-bold text-slate-800 tracking-wide mt-0.5">{new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</div>
                        </div>
                        <div className="bg-white rounded-[12px] p-4 flex flex-col gap-1 border border-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
                            <Clock className="w-4 h-4" strokeWidth={1.5} /> Saat
                          </div>
                          <div className="text-[14px] font-bold text-slate-800 tracking-wide mt-0.5">{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div className="bg-white rounded-[12px] p-4 flex flex-col gap-1 border border-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
                            <Scale className="w-4 h-4" strokeWidth={1.5} /> Ağırlık
                          </div>
                          <div className="text-[14px] font-bold text-slate-800 tracking-wide mt-0.5">{totalActualWeight.toFixed(1)} kg</div>
                        </div>
                        <div className="bg-white rounded-[12px] p-4 flex flex-col gap-1 border border-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
                            <Package className="w-4 h-4" strokeWidth={1.5} /> Koli
                          </div>
                          <div className="text-[14px] font-bold text-slate-800 tracking-wide mt-0.5">{totalPackageCount} adet</div>
                        </div>
                        <div className="bg-white rounded-[12px] p-4 flex flex-col gap-1 border border-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
                            <ArrowRightSquare className="w-4 h-4" strokeWidth={1.5} /> Gönderici
                          </div>
                          <div className="text-[14px] font-bold text-slate-800 tracking-wide mt-0.5 truncate" title={selectedSenderAddr?.label || draft.senderName || "Gönderici"}>{selectedSenderAddr?.label?.split(" ")[0] || draft.senderName?.split(" ")[0] || "Gönderici"} {selectedSenderAddr?.label?.split(" ")[1] || draft.senderName?.split(" ")[1] || ""}</div>
                        </div>
                        <div className="bg-white rounded-[12px] p-4 flex flex-col gap-1 border border-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
                            <ArrowLeftSquare className="w-4 h-4" strokeWidth={1.5} /> Alıcı
                          </div>
                          <div className="text-[14px] font-bold text-slate-800 tracking-wide mt-0.5 truncate" title={draft.receiverName || "Alıcı"}>{draft.receiverName || "Alıcı"}</div>
                        </div>
                      </div>

                      {/* Horizontal Dashed Line */}
                      <div className="border-t-[1.5px] border-dashed border-slate-200/80 w-full mb-6 relative z-20"></div>

                      {/* Takip & Fiyat */}
                      <div className="flex items-end justify-between px-2 mb-8 relative z-20">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-medium text-slate-400">Takip Numarası</span>
                          <span className="text-[18px] font-bold text-slate-800 tracking-wide">ZLSMN64TK8M</span>
                        </div>
                        <div className="flex flex-col gap-1.5 text-right">
                          <span className="text-[11px] font-medium text-slate-400">Toplam Ücret</span>
                          <span className="text-[26px] font-black text-slate-800 leading-none">{selectedQuote ? getCurrencySymbol(selectedQuote.currency) : "$"}{(selectedQuote?.price || 275.15).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Barcode */}
                      <div className="flex justify-center w-full opacity-80 mix-blend-multiply relative z-20">
                        <div className="h-14 w-full max-w-[200px] flex gap-[2px] bg-transparent items-center justify-center overflow-hidden grayscale">
                           {[...Array(42)].map((_, i) => {
                             const widths = ["w-[1px]", "w-[2.5px]", "w-[1px]", "w-[3.5px]", "w-[1px]", "w-[2px]"];
                             return (
                               <div key={i} className={cn("h-full bg-[#111] rounded-[0.5px]", widths[i % widths.length])} style={{ opacity: Math.sin(i) > 0.5 ? 0.8 : 1 }} />
                             );
                           })}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-[540px]">
                    <button type="button" onClick={resetAndNewShipment} className="flex-1 flex items-center justify-center gap-2.5 h-[52px] rounded-[12px] border border-slate-200 bg-white text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm px-2">
                      <PlusSquare className="h-4 w-4 shrink-0 text-slate-500 stroke-[2.5]" /> 
                      <span className="whitespace-nowrap">Yeni Gönderi Oluştur</span>
                    </button>
                    <button type="button" className="flex-1 flex items-center justify-center gap-2.5 h-[52px] rounded-[12px] bg-[#3B5FE5] hover:bg-[#324FC7] text-white text-[13px] font-bold transition-all shadow-sm px-2">
                      <Tag className="h-4 w-4 shrink-0" /> 
                      <span className="whitespace-nowrap">Etiket Oluştur ve Takip No Öğren</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== EXTRA SERVICES MODAL ===== */}
      {/* GEÇİCİ OLARAK İPTAL EDİLDİ */}
      {false && showServicesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[500px] rounded-[24px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Size Uygun Ek Hizmetler</h2>
              <button onClick={() => setShowServicesModal(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {/* Sigorta Card */}
              <div 
                className={cn(
                  "rounded-2xl border-2 p-5 cursor-pointer transition-all bg-white relative",
                  draft.hasInsurance ? "border-brand-500 shadow-[0_4px_16px_rgba(37,99,235,0.15)] ring-4 ring-brand-50" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                )}
                onClick={() => update("hasInsurance", !draft.hasInsurance)}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex shrink-0 h-6 w-6 mt-0.5 items-center justify-center rounded-[6px] transition-colors border-2",
                    draft.hasInsurance ? "bg-brand-600 border-brand-600 text-white" : "border-slate-300 bg-white"
                  )}>
                    {draft.hasInsurance && <Check className="h-4 w-4" strokeWidth={3} />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-[16px] font-bold text-slate-900">Gönderimi Sigortala</div>
                      <div className="text-[15px] font-extrabold text-slate-900">{getCurrencySymbol(selectedQuote?.currency ?? "EUR")} 52.20</div>
                    </div>
                    <p className="mt-2 text-[14px] text-slate-500 font-medium leading-relaxed pr-2">
                      Kayıp veya hasar durumunda gönderi bedelinizi güvence altına almak için sigorta seçmenizi öneririz.
                    </p>
                    <div className="mt-4">
                      <a href="#" className="text-[14px] font-bold text-brand-600 hover:underline inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        Sigorta Koşulları Nelerdir?
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => { update("hasInsurance", false); confirmServicesAndNext(); }}
                  className="font-bold px-6 h-12 rounded-xl"
                >
                  Seçmeden Devam Et
                </Button>
                <Button onClick={confirmServicesAndNext} className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 h-12 rounded-xl">
                  Onayla ve Devam Et
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showProformaExcel && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowProformaExcel(false)} />
    <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-slate-900">Excel'den Ürün Yükle</h3>
        <button onClick={() => setShowProformaExcel(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <ProformaExcelUploader
        onImport={importProformaFromExcel}
        onClose={() => setShowProformaExcel(false)}
      />
    </div>
  </div>
)}
{showPackageExcel && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPackageExcel(false)} />
    <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-slate-900">Excel'den Paket Yükle</h3>
        <button onClick={() => setShowPackageExcel(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <PackageExcelUploader
        onImport={importPackagesFromExcel}
        onClose={() => setShowPackageExcel(false)}
      />
    </div>
  </div>
)}
    </div>
  );
}