// =====================================================================
// 1) HS CODE VERİTABANI - Dosyanın üstüne ekle (types'dan sonra)
// =====================================================================
import React from "react";
import { X, Globe, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { gtipService, type GtipResponse } from "@/lib/services/shipmentService";

type HSCodeEntry = { code: string; tr: string; en: string; keywords: string[] };

const HS_CODE_DB: HSCodeEntry[] = [
  // Meyveler
  { code: "080810000013", tr: "Elma (taze)", en: "Fresh apples", keywords: ["elma", "apple", "meyve"] },
  { code: "200799500011", tr: "Elma püresi (komposto dahil)", en: "Apple puree", keywords: ["elma", "püre", "komposto"] },
  { code: "080810800013", tr: "Starking elma", en: "Starking apple", keywords: ["elma", "starking"] },
  { code: "080520000011", tr: "Mandalina (taze)", en: "Fresh mandarins", keywords: ["mandalina", "narenciye"] },
  { code: "080610000013", tr: "Üzüm (taze)", en: "Fresh grapes", keywords: ["üzüm", "grape"] },
  // Tekstil / Giyim
  { code: "620342000012", tr: "Erkek pantolon (pamuklu)", en: "Men's trousers cotton", keywords: ["pantolon", "erkek", "giyim", "elbise"] },
  { code: "620462000014", tr: "Kadın pantolon (pamuklu)", en: "Women's trousers cotton", keywords: ["pantolon", "kadın", "giyim", "elbise"] },
  { code: "610910000015", tr: "Tişört (pamuklu)", en: "T-shirt cotton", keywords: ["tişört", "tshirt", "giyim", "elbise"] },
  { code: "611020000011", tr: "Kazak / Süveter", en: "Sweater / Pullover", keywords: ["kazak", "süveter", "giyim", "elbise"] },
  { code: "620520000019", tr: "Erkek gömlek", en: "Men's shirt", keywords: ["gömlek", "erkek", "giyim", "elbise"] },
  { code: "640319000011", tr: "Spor ayakkabı", en: "Sports footwear", keywords: ["ayakkabı", "spor", "sneaker"] },
  // Elektronik
  { code: "851712000011", tr: "Cep telefonu / Smartphone", en: "Mobile phone", keywords: ["telefon", "cep", "smartphone", "elektronik"] },
  { code: "847130000015", tr: "Dizüstü bilgisayar / Laptop", en: "Laptop", keywords: ["laptop", "bilgisayar", "elektronik"] },
  { code: "851830000013", tr: "Kulaklık", en: "Headphones", keywords: ["kulaklık", "headphone", "airpods", "elektronik"] },
  { code: "854370000011", tr: "Tablet", en: "Tablet computer", keywords: ["tablet", "ipad", "elektronik"] },
  // Gıda
  { code: "170490000011", tr: "Çikolata / Şekerleme", en: "Chocolate / Confectionery", keywords: ["çikolata", "şeker", "gıda"] },
  { code: "090240000013", tr: "Çay (siyah)", en: "Black tea", keywords: ["çay", "tea", "gıda"] },
  { code: "090121000011", tr: "Kahve (kavrulmuş)", en: "Coffee (roasted)", keywords: ["kahve", "coffee", "gıda"] },
  { code: "150910000019", tr: "Zeytinyağı", en: "Olive oil", keywords: ["zeytinyağı", "olive", "gıda"] },
  // Kozmetik
  { code: "330499000013", tr: "Kozmetik / Makyaj", en: "Cosmetics / Makeup", keywords: ["kozmetik", "makyaj", "güzellik"] },
  { code: "330300000017", tr: "Parfüm", en: "Perfume", keywords: ["parfüm", "perfume", "koku"] },
  // Aksesuar
  { code: "420221000015", tr: "El çantası (deri)", en: "Leather handbag", keywords: ["çanta", "deri", "aksesuar"] },
  { code: "711319000013", tr: "Altın takı / Mücevher", en: "Gold jewelry", keywords: ["altın", "takı", "mücevher"] },
  // Diğer
  { code: "950300000019", tr: "Oyuncak", en: "Toys", keywords: ["oyuncak", "toy", "çocuk"] },
  { code: "490199000015", tr: "Kitap (basılı)", en: "Printed books", keywords: ["kitap", "book"] },
  { code: "570242000017", tr: "Halı (dokunmuş)", en: "Woven carpet", keywords: ["halı", "kilim", "carpet"] },
];

function searchHSCodes(query: string): HSCodeEntry[] {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];
  return HS_CODE_DB.filter(entry =>
    entry.code.startsWith(q) ||
    entry.tr.toLowerCase().includes(q) ||
    entry.en.toLowerCase().includes(q) ||
    entry.keywords.some(kw => kw.includes(q))
  ).slice(0, 8);
}


// =====================================================================
// 2) HSCodeCombobox BİLEŞENİ - AI destekli GTİP tahmin entegrasyonu
// =====================================================================

export function HSCodeCombobox({
  value,
  onChange,
  productHint,
}: {
  value: string;
  onChange: (code: string) => void;
  productHint: string; // ürün açıklaması, otomatik öneri için
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState(value);
  const ref = React.useRef<HTMLDivElement>(null);

  // ── AI Tahmin State'leri ──
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<GtipResponse | null>(null);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastHintRef = React.useRef("");

  React.useEffect(() => { setSearch(value); }, [value]);

  // Dışarı tıklayınca kapat
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── AI Debounce: productHint değiştiğinde 800ms sonra API'ye sor ──
  React.useEffect(() => {
    // Sadece ürün adı değiştiğinde ve yeterince uzunsa çalış
    const hint = productHint?.trim() || "";
    if (hint.length < 3 || hint === lastHintRef.current) return;

    // Eğer kullanıcı zaten manuel HS kodu girdiyse sorma
    if (value && value.length >= 4) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      lastHintRef.current = hint;
      setAiLoading(true);
      setAiResult(null);
      try {
        const res = await gtipService.predict(hint);
        setAiResult(res);
        // Otomatik olarak HS kodunu doldur
        if (res.hs_code) {
          onChange(res.hs_code);
          setSearch(res.hs_code);
        }
      } catch {
        // sessizce geç
      } finally {
        setAiLoading(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productHint]);

  // Arama sonuçları: kullanıcı yazıyorsa ona göre, yoksa ürün adına göre
  const results = React.useMemo(() => {
    const q = search || productHint;
    return searchHSCodes(q);
  }, [search, productHint]);

  return (
    <div ref={ref} className="relative w-full h-full flex-1">
      <div className="flex h-full w-full items-center px-4">
        <Input
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Kod veya ürün adı yazın"
          className="h-full w-full border-0 ring-0 focus:ring-0 shadow-none bg-transparent text-sm px-0"
        />
        {/* AI Loading spinner */}
        {aiLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-violet-500 shrink-0 mr-1" />
        )}
        {value && !aiLoading && (
          <button type="button" onClick={() => { setSearch(""); onChange(""); setAiResult(null); lastHintRef.current = ""; }} className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors ml-1">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* AI Tahmin Bilgi Bandı (dropdown dışında, input altında) */}
      {aiResult && !open && (
        <div className="absolute left-0 top-[calc(100%-2px)] z-40 w-full">
          <div className="flex items-center gap-2 rounded-b-xl bg-gradient-to-r from-violet-50 to-indigo-50 px-3 py-1.5 ring-1 ring-violet-200/50">
            <Sparkles className="h-3 w-3 text-violet-500 shrink-0" />
            <span className="text-[11px] text-violet-700 truncate">
              <span className="font-semibold">{aiResult.resolved_name}</span>
              <span className="text-violet-400 mx-1">•</span>
              <span className="font-mono">{aiResult.hs_code}</span>
              <span className="text-violet-400 mx-1">•</span>
              <span className="text-violet-500">%{aiResult.confidence_score} güven</span>
              {aiResult.status === "cache" && <span className="text-emerald-600 ml-1">(önbellek)</span>}
            </span>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {open && (results.length > 0 || aiResult) && (
        <div className="absolute left-0 top-[calc(100%-4px)] z-50 w-[280px] sm:w-[320px] max-h-64 overflow-auto rounded-[5px] bg-surface shadow-lg ring-1 ring-border">

          {/* AI Tahmin Önerisi (varsa en üstte) */}
          {aiResult && (
            <div className="border-b border-violet-100">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600 bg-violet-50 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                AI Tahmin
                {aiResult.status === "cache" && <span className="text-emerald-600 ml-1 normal-case font-normal">(önbellek)</span>}
              </div>
              <button
                type="button"
                onClick={() => { onChange(aiResult.hs_code); setSearch(aiResult.hs_code); setOpen(false); }}
                className={cn(
                  "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-violet-50",
                  value === aiResult.hs_code && "bg-violet-50"
                )}
              >
                <div className="shrink-0 rounded bg-violet-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-violet-700">
                  {aiResult.hs_code}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">{aiResult.resolved_name}</div>
                  <div className="text-xs text-violet-500">Güven: %{aiResult.confidence_score}</div>
                </div>
              </button>
            </div>
          )}

          {!search && productHint && !aiResult && (
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted bg-surface-2">
              &quot;{productHint}&quot; için önerilen GTIP kodları
            </div>
          )}

          {results.map(entry => (
            <button
              key={entry.code}
              type="button"
              onClick={() => { onChange(entry.code); setSearch(entry.code); setOpen(false); }}
              className={cn(
                "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-brand-50",
                value === entry.code && "bg-brand-50"
              )}
            >
              <div className="shrink-0 rounded bg-sky-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-sky-700">
                {entry.code}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">{entry.tr}</div>
                <div className="text-xs text-muted truncate">{entry.en}</div>
              </div>
            </button>
          ))}

          {/* GTİP sorgulama linki */}
          <div className="border-t border-border px-3 py-2">
            <a href="https://uygulama.gtb.gov.tr/Tara" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-medium text-sky-600 hover:text-sky-700 hover:underline">
              <Globe className="h-3 w-3" />
              GTİP - HSCODE sorgula (T.C. Ticaret Bakanlığı)
            </a>
          </div>
        </div>
      )}

      {/* Sonuç yoksa bilgi */}
      {open && search && search.length >= 2 && results.length === 0 && !aiResult && !aiLoading && (
        <div className="absolute left-0 top-[calc(100%-4px)] z-50 w-[280px] sm:w-[320px] rounded-[5px] bg-surface shadow-lg ring-1 ring-border">
          <div className="px-3 py-3 text-xs text-muted text-center">Sonuç bulunamadı. Kodu manuel girebilirsiniz.</div>
          <div className="border-t border-border px-3 py-2">
            <a href="https://uygulama.gtb.gov.tr/Tara" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-medium text-sky-600 hover:text-sky-700 hover:underline">
              <Globe className="h-3 w-3" />
              GTİP - HSCODE sorgula (T.C. Ticaret Bakanlığı)
            </a>
          </div>
        </div>
      )}

      {/* AI yükleniyor durumu (dropdown açıkken) */}
      {open && aiLoading && results.length === 0 && (
        <div className="absolute left-0 top-[calc(100%-4px)] z-50 w-[280px] sm:w-[320px] rounded-[5px] bg-surface shadow-lg ring-1 ring-border">
          <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-violet-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI ile GTİP kodu tahmin ediliyor...</span>
          </div>
        </div>
      )}
    </div>
  );
}


// =====================================================================
// 3) PROFORMA ÜRÜN SATIRINDA DEĞİŞİKLİK
//    Eski HS Kodu FloatingField + Input yerine HSCodeCombobox kullan
// =====================================================================

// ESKİ KOD (bunu bul ve sil):
//
//   <FloatingField label="HS Kodu">
//     <Input value={item.hsCode} onChange={e => updateProformaItem(item.id, "hsCode", e.target.value)} placeholder="081190950014" className="h-9 border-0 ring-0 focus:ring-0 px-0 bg-transparent text-sm" />
//   </FloatingField>
//
// YENİ KOD (yerine bunu koy):

/*
  <HSCodeCombobox
    value={item.hsCode}
    onChange={v => updateProformaItem(item.id, "hsCode", v)}
    productHint={item.productDescription}
  />
*/

// Ayrıca import'lara X ve Globe ekle (lucide-react'tan):
// import { ..., X, Globe } from "lucide-react";