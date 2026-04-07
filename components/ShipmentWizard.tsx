"use client";

import React, { useState, useEffect } from "react";
import {
  Package, FileText, BoxSelect, ArrowLeft, ArrowRight, Check,
  Loader2, MapPin, Ruler, Truck, Receipt, CheckCircle2, Globe,
  User, Phone, Building, MapPinned, Shield, AlertTriangle,
  Clock, Star, Zap, BadgeDollarSign,
} from "lucide-react";
import {
  shipmentService, addressService,
  type ApiCarrierQuote, type ApiAddress, type ApiPackage,
} from "@/lib/services/shipmentService";
import { CitySelect } from "@/components/ui/city-select";

// ─── Config ────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const WIZARD_STEPS = [
  { label: "Kargo Bilgileri", icon: Package },
  { label: "Paket Ölçüleri", icon: Ruler },
  { label: "Fiyatlandırma", icon: Truck },
  { label: "Adresler", icon: MapPin },
  { label: "Proforma", icon: Receipt },
  { label: "Onay", icon: CheckCircle2 },
];

const SHIPMENT_TYPES = [
  { value: "Paket", label: "📦 Paket", desc: "Ürün, aksesuar, numune" },
  { value: "Belge", label: "📄 Belge", desc: "Dosya, sözleşme, fatura" },
  { value: "Koli", label: "📦 Koli", desc: "Büyük paketler" },
];

interface ShipmentWizardProps {
  onClose: () => void;
  onComplete: (trackingCode: string, totalCost: number) => void;
}

export default function ShipmentWizard({ onClose, onComplete }: ShipmentWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 0: Temel bilgiler
  const [shipmentType, setShipmentType] = useState("Paket");
  const [receiverCountry, setReceiverCountry] = useState("");
  const [receiverPostalCode, setReceiverPostalCode] = useState("");
  const [countries, setCountries] = useState<{ isoCode: string; countryName: string }[]>([]);
  const [countrySearch, setCountrySearch] = useState("");

  // Step 1: Paket ölçüleri
  const [widthCm, setWidthCm] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [packageCount, setPackageCount] = useState("1");

  // Step 2: Fiyatlandırma
  const [quotes, setQuotes] = useState<ApiCarrierQuote[]>([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState("");
  const [hasInsurance, setHasInsurance] = useState(false);

  // Step 3: Adresler
  const [senderAddresses, setSenderAddresses] = useState<ApiAddress[]>([]);
  const [receiverAddresses, setReceiverAddresses] = useState<ApiAddress[]>([]);
  const [selectedSenderAddressId, setSelectedSenderAddressId] = useState<number | null>(null);
  const [selectedReceiverAddressId, setSelectedReceiverAddressId] = useState<number | null>(null);
  const [showNewReceiver, setShowNewReceiver] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverCompany, setReceiverCompany] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverCity, setReceiverCity] = useState("");

  // Step 4: Proforma
  const [proformaDescription, setProformaDescription] = useState("");
  const [proformaCurrency, setProformaCurrency] = useState("EUR");
  const [productDescription, setProductDescription] = useState("");
  const [productQuantity, setProductQuantity] = useState("1");
  const [productUnitPrice, setProductUnitPrice] = useState("");
  const [productHsCode, setProductHsCode] = useState("");

  const [descriptionTypes, setDescriptionTypes] = useState<{ id: number; label: string }[]>([]);

  // ── Ülkeleri yükle ──
  useEffect(() => {
    fetch(`${API_BASE}/api/countries`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) setCountries(data);
      })
      .catch(() => {});
  }, []);

  // ── Adresleri yükle ──
  useEffect(() => {
    addressService.list().then(r => {
      setSenderAddresses(r.addresses.filter(a => a.type === "sender"));
      setReceiverAddresses(r.addresses.filter(a => a.type === "receiver"));
      // İlk gönderici adresini seç
      const firstSender = r.addresses.find(a => a.type === "sender");
      if (firstSender) setSelectedSenderAddressId(firstSender.id);
    }).catch(() => {});
  }, []);

  // ── Gönderi açıklama tiplerini yükle ──
  useEffect(() => {
    fetch(`${API_BASE}/api/shipment-description-types`)
      .then(r => r.json())
      .then((data: any) => {
        if (data?.types) setDescriptionTypes(data.types);
      })
      .catch(() => {});
  }, []);

  // ── Hesaplamalar ──
  const w = Math.max(parseFloat(widthCm) || 0, 0);
  const l = Math.max(parseFloat(lengthCm) || 0, 0);
  const h = Math.max(parseFloat(heightCm) || 0, 0);
  const kg = Math.max(parseFloat(weightKg) || 0, 0);
  const cnt = Math.max(parseInt(packageCount) || 1, 1);
  const volumetricWeight = (w * l * h) / 5000;
  const chargeableWeight = Math.max(kg, volumetricWeight) * cnt;

  const selectedQuote = quotes.find(q => q.carrierId === selectedCarrierId);
  const totalCost = (selectedQuote?.priceTry ?? 0) + (hasInsurance ? 52.20 : 0);

  const filteredCountries = countries.filter(c => {
    const q = countrySearch.toLowerCase();
    return !q || c.countryName.toLowerCase().includes(q) || c.isoCode.toLowerCase().includes(q);
  });

  const selectedCountryName = countries.find(c => c.isoCode === receiverCountry)?.countryName || receiverCountry;

  // ── Adım geçişi ──
  async function goNext() {
    setError(null);
    setLoading(true);

    try {
      if (step === 0) {
        if (!receiverCountry) { setError("Hedef ülke seçiniz."); setLoading(false); return; }
        if (!receiverPostalCode) { setError("Posta kodu giriniz."); setLoading(false); return; }
      }

      if (step === 1) {
        if (!widthCm || !lengthCm || !heightCm || !weightKg) {
          setError("Tüm paket ölçülerini giriniz."); setLoading(false); return;
        }
        // Belge tipinde sabit ölçüler
        const packages: ApiPackage[] = shipmentType === "Belge"
          ? [{ widthCm: 1, lengthCm: 1, heightCm: 1, weightKg: 0.5, packageCount: 1 }]
          : [{ widthCm: w, lengthCm: l, heightCm: h, weightKg: kg, packageCount: cnt }];

        // Fiyat sorgula
        const res = await shipmentService.getQuotes({
          senderCountry: "TR",
          receiverCountry,
          receiverPostalCode,
          packages,
        });
        setQuotes(res.quotes || []);
        if (!res.quotes?.length) {
          setError("Bu rota için uygun kargo firması bulunamadı.");
          setLoading(false);
          return;
        }
        // Tavsiye edileni seç
        const rec = res.quotes.find(q => q.tags.includes("recommended"));
        setSelectedCarrierId(rec?.carrierId || res.quotes[0]?.carrierId || "");
      }

      if (step === 2) {
        if (!selectedCarrierId) { setError("Kargo firması seçiniz."); setLoading(false); return; }
      }

      if (step === 3) {
        if (!selectedSenderAddressId) { setError("Gönderici adresi seçiniz."); setLoading(false); return; }
        if (!selectedReceiverAddressId && !showNewReceiver) { setError("Alıcı adresi seçiniz veya yeni adres giriniz."); setLoading(false); return; }
        if (showNewReceiver && (!receiverName || !receiverAddress || !receiverCity)) {
          setError("Alıcı bilgilerini eksiksiz giriniz."); setLoading(false); return;
        }
      }

      if (step === 4) {
        if (!proformaDescription) { setError("Gönderi açıklaması seçiniz."); setLoading(false); return; }
        if (!productDescription) { setError("Ürün açıklaması giriniz."); setLoading(false); return; }
        if (!productUnitPrice) { setError("Birim fiyat giriniz."); setLoading(false); return; }
      }

      setStep(s => s + 1);
    } catch (err: any) {
      setError(err?.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  // ── Kargo oluştur ──
  async function handleCreate() {
    setError(null);
    setLoading(true);

    try {
      const packages: ApiPackage[] = shipmentType === "Belge"
        ? [{ widthCm: 1, lengthCm: 1, heightCm: 1, weightKg: 0.5, packageCount: 1 }]
        : [{ widthCm: w, lengthCm: l, heightCm: h, weightKg: kg, packageCount: cnt }];

      const result = await shipmentService.quickCreate({
        shipmentType: shipmentType as "Belge" | "Paket" | "Koli",
        receiverCountry,
        receiverPostalCode,
        packages,
        selectedCarrierId,
        hasInsurance,
        senderAddressId: selectedSenderAddressId,
        receiverAddressId: showNewReceiver ? null : selectedReceiverAddressId,
        receiverName: showNewReceiver ? receiverName : undefined,
        receiverCompany: showNewReceiver ? receiverCompany : undefined,
        receiverPhone: showNewReceiver ? receiverPhone : undefined,
        receiverAddress: showNewReceiver ? receiverAddress : undefined,
        receiverCity: showNewReceiver ? receiverCity : undefined,
        proformaDescription,
        proformaCurrency,
        proformaItems: [{
          productDescription,
          hsCode: productHsCode,
          quantity: Math.max(1, parseInt(productQuantity) || 1),
          unitPrice: parseFloat(productUnitPrice) || 0,
          originCountry: "TR",
        }],
        autoFinalize: true,
      });

      onComplete(result.trackingCode, result.totalCost);
    } catch (err: any) {
      setError(err?.message || "Kargo oluşturulamadı.");
    } finally {
      setLoading(false);
    }
  }

  // ── Belge tipi seçildiğinde otomatik ölçüler ──
  useEffect(() => {
    if (shipmentType === "Belge") {
      setWidthCm("1"); setLengthCm("1"); setHeightCm("1"); setWeightKg("0.5"); setPackageCount("1");
    }
  }, [shipmentType]);

  // ── CSS classes ──
  const inputCls = "w-full h-9 px-3 rounded-lg bg-slate-50 text-[13px] text-slate-700 border border-slate-200 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 transition-all";
  const labelCls = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1";
  const cardCls = "rounded-xl p-3 ring-1 ring-slate-200 bg-white transition-all cursor-pointer hover:ring-blue-200";
  const cardSelectedCls = "rounded-xl p-3 ring-2 ring-blue-500 bg-blue-50/60 transition-all cursor-pointer";

  return (
    <div className="flex flex-col h-full">
      {/* ── Step indicator ── */}
      <div className="px-4 py-2 shrink-0 flex gap-1 bg-[#1e3a8a]">
        {WIZARD_STEPS.map((s, i) => (
          <div key={i} className="flex-1 text-center">
            <div className={`h-1 rounded-full transition-all mb-1 ${i < step ? "bg-emerald-400" : i === step ? "bg-white" : "bg-white/20"}`} />
            <span className={`text-[9px] font-medium hidden sm:block ${i <= step ? "text-white/90" : "text-white/30"}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#f0f4ff" }}>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ══════════ STEP 0: Temel Bilgiler ══════════ */}
        {step === 0 && (
          <div className="space-y-4">
            {/* Gönderi tipi */}
            <div>
              <label className={labelCls}>Gönderi Tipi</label>
              <div className="grid grid-cols-3 gap-2">
                {SHIPMENT_TYPES.map(t => (
                  <button key={t.value} onClick={() => setShipmentType(t.value)}
                    className={shipmentType === t.value ? cardSelectedCls : cardCls}>
                    <div className="text-center">
                      <div className="text-lg">{t.label.slice(0, 2)}</div>
                      <div className="text-[11px] font-semibold mt-1">{t.value}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hedef ülke */}
            <div>
              <label className={labelCls}>Hedef Ülke</label>
              <input
                type="text"
                value={countrySearch}
                onChange={e => { setCountrySearch(e.target.value); if (receiverCountry) setReceiverCountry(""); }}
                placeholder="Ülke ara... (ör: Almanya)"
                className={inputCls}
              />
              {countrySearch && !receiverCountry && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                  {filteredCountries.slice(0, 8).map(c => (
                    <button key={c.isoCode} onClick={() => { setReceiverCountry(c.isoCode); setCountrySearch(c.countryName); }}
                      className="w-full text-left px-3 py-2 text-[12px] hover:bg-blue-50 flex items-center gap-2">
                      <img src={`https://flagcdn.com/w20/${c.isoCode.toLowerCase()}.png`} alt={c.isoCode} className="h-3.5 w-5 object-cover rounded-sm" />
                      <span>{c.countryName}</span>
                      <span className="text-slate-400 ml-auto">{c.isoCode}</span>
                    </button>
                  ))}
                </div>
              )}
              {receiverCountry && (
                <div className="mt-1 flex items-center gap-2 text-[12px] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  <Check className="h-3.5 w-3.5" />
                  <span>{selectedCountryName} ({receiverCountry})</span>
                </div>
              )}
            </div>

            {/* Posta kodu */}
            <div>
              <label className={labelCls}>Alıcı Posta Kodu</label>
              <input type="text" value={receiverPostalCode} onChange={e => setReceiverPostalCode(e.target.value)}
                placeholder="Posta kodu (ör: 10115)" className={inputCls} />
            </div>
          </div>
        )}

        {/* ══════════ STEP 1: Paket Ölçüleri ══════════ */}
        {step === 1 && (
          <div className="space-y-3">
            {shipmentType === "Belge" ? (
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-[13px] font-semibold text-slate-700">Belge gönderimi</p>
                <p className="text-[11px] text-slate-500 mt-1">Sabit ölçüler: 0.5 kg, otomatik hesaplanır</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>En (cm)</label>
                    <input type="number" value={widthCm} onChange={e => setWidthCm(e.target.value)} placeholder="30" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Boy (cm)</label>
                    <input type="number" value={lengthCm} onChange={e => setLengthCm(e.target.value)} placeholder="20" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Yükseklik (cm)</label>
                    <input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="15" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Ağırlık (kg)</label>
                    <input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="2.5" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Adet</label>
                  <input type="number" value={packageCount} onChange={e => setPackageCount(e.target.value)} placeholder="1" className={inputCls} />
                </div>

                {/* Desi bilgisi */}
                {w > 0 && l > 0 && h > 0 && kg > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Desi</span>
                      <span className="font-semibold">{(volumetricWeight * cnt).toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Gerçek ağırlık</span>
                      <span className="font-semibold">{(kg * cnt).toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between text-[12px] pt-1 border-t border-slate-200">
                      <span className="text-slate-700 font-semibold">Ücretlendirme</span>
                      <span className="font-bold text-blue-600">{chargeableWeight.toFixed(2)} kg</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════ STEP 2: Fiyatlandırma ══════════ */}
        {step === 2 && (
          <div className="space-y-3">
            {quotes.length === 0 ? (
              <div className="text-center py-6 text-[13px] text-slate-500">Uygun kargo firması bulunamadı.</div>
            ) : (
              <>
                <p className="text-[11px] text-slate-500 font-medium">
                  {quotes.length} kargo seçeneği bulundu
                </p>
                {quotes.map(q => {
                  const isSelected = selectedCarrierId === q.carrierId;
                  return (
                    <button key={q.carrierId} onClick={() => setSelectedCarrierId(q.carrierId)}
                      className={`w-full text-left ${isSelected ? cardSelectedCls : cardCls}`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm ${q.logoColor || "bg-slate-600"}`}>
                          {q.logoLetter}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-semibold">{q.carrierName}</span>
                            {q.tags.includes("recommended") && <Star className="h-3 w-3 text-amber-500" />}
                            {q.tags.includes("fastest") && <Zap className="h-3 w-3 text-sky-500" />}
                            {q.tags.includes("cheapest") && <BadgeDollarSign className="h-3 w-3 text-emerald-500" />}
                          </div>
                          <div className="text-[11px] text-slate-500">{q.serviceName} · {q.deliveryLabel}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[15px] font-bold">{q.priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</div>
                          <div className="text-[10px] text-slate-400">{q.currency} {q.price.toFixed(2)}</div>
                        </div>
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center ring-1 ${isSelected ? "bg-blue-600 ring-blue-600 text-white" : "ring-slate-300"}`}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Sigorta */}
                <button onClick={() => setHasInsurance(!hasInsurance)}
                  className={`w-full text-left ${hasInsurance ? cardSelectedCls : cardCls}`}>
                  <div className="flex items-center gap-3">
                    <Shield className={`h-5 w-5 ${hasInsurance ? "text-blue-600" : "text-slate-400"}`} />
                    <div className="flex-1">
                      <div className="text-[12px] font-semibold">Kargo Sigortası</div>
                      <div className="text-[10px] text-slate-500">Kayıp/hasar güvencesi</div>
                    </div>
                    <span className="text-[12px] font-bold text-slate-700">+52,20 ₺</span>
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center ring-1 ${hasInsurance ? "bg-blue-600 ring-blue-600 text-white" : "ring-slate-300"}`}>
                      {hasInsurance && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        )}

        {/* ══════════ STEP 3: Adresler ══════════ */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Gönderici */}
            <div>
              <label className={labelCls}>📤 Gönderici Adresi</label>
              {senderAddresses.length === 0 ? (
                <p className="text-[11px] text-slate-500">Kayıtlı gönderici adresi yok. Profil sayfasından ekleyebilirsiniz.</p>
              ) : (
                <div className="space-y-2">
                  {senderAddresses.map(a => (
                    <button key={a.id} onClick={() => setSelectedSenderAddressId(a.id)}
                      className={`w-full text-left ${selectedSenderAddressId === a.id ? cardSelectedCls : cardCls}`}>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold truncate">{a.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{a.address}, {a.city}</div>
                        </div>
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center ring-1 ${selectedSenderAddressId === a.id ? "bg-blue-600 ring-blue-600 text-white" : "ring-slate-300"}`}>
                          {selectedSenderAddressId === a.id && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Alıcı */}
            <div>
              <label className={labelCls}>📥 Alıcı Adresi</label>
              {receiverAddresses.length > 0 && !showNewReceiver && (
                <div className="space-y-2">
                  {receiverAddresses.map(a => (
                    <button key={a.id} onClick={() => setSelectedReceiverAddressId(a.id)}
                      className={`w-full text-left ${selectedReceiverAddressId === a.id ? cardSelectedCls : cardCls}`}>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold truncate">{a.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{a.address}, {a.city}</div>
                        </div>
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center ring-1 ${selectedReceiverAddressId === a.id ? "bg-blue-600 ring-blue-600 text-white" : "ring-slate-300"}`}>
                          {selectedReceiverAddressId === a.id && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => { setShowNewReceiver(!showNewReceiver); setSelectedReceiverAddressId(null); }}
                className="mt-2 w-full text-center py-2 rounded-lg text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                {showNewReceiver ? "Kayıtlı adreslerden seç" : "+ Yeni alıcı adresi gir"}
              </button>

              {showNewReceiver && (
                <div className="mt-3 space-y-2">
                  <input type="text" value={receiverName} onChange={e => setReceiverName(e.target.value)}
                    placeholder="Alıcı adı soyadı" className={inputCls} />
                  <input type="text" value={receiverCompany} onChange={e => setReceiverCompany(e.target.value)}
                    placeholder="Firma adı (opsiyonel)" className={inputCls} />
                  <input type="text" value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)}
                    placeholder="Telefon" className={inputCls} />
                  <div>
                    <label className={labelCls}>Şehir</label>
                    <CitySelect
                      countryCode={receiverCountry}
                      value={receiverCity}
                      onChange={(v) => setReceiverCity(v)}
                      placeholder="Şehir seçiniz"
                      className="h-9 text-[13px]"
                    />
                  </div>
                  <input type="text" value={receiverAddress} onChange={e => setReceiverAddress(e.target.value)}
                    placeholder="Açık adres" className={inputCls} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ STEP 4: Proforma ══════════ */}
        {step === 4 && (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Gönderi Açıklaması</label>
              <select value={proformaDescription} onChange={e => setProformaDescription(e.target.value)}
                className={inputCls}>
                <option value="">Seçiniz...</option>
                {descriptionTypes.map(t => (
                  <option key={t.id} value={t.label}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Para Birimi</label>
              <select value={proformaCurrency} onChange={e => setProformaCurrency(e.target.value)} className={inputCls}>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Ürün Açıklaması (İngilizce)</label>
              <input type="text" value={productDescription} onChange={e => setProductDescription(e.target.value)}
                placeholder="Cotton T-Shirt" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Adet</label>
                <input type="number" value={productQuantity} onChange={e => setProductQuantity(e.target.value)}
                  placeholder="1" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Birim Fiyat ({proformaCurrency})</label>
                <input type="number" value={productUnitPrice} onChange={e => setProductUnitPrice(e.target.value)}
                  placeholder="12.50" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>HS Kodu (opsiyonel)</label>
              <input type="text" value={productHsCode} onChange={e => setProductHsCode(e.target.value)}
                placeholder="6109.10" className={inputCls} />
            </div>
          </div>
        )}

        {/* ══════════ STEP 5: Onay ══════════ */}
        {step === 5 && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 ring-1 ring-slate-200 space-y-3">
              <h4 className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-500" />
                Sipariş Özeti
              </h4>

              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between"><span className="text-slate-500">Gönderi Tipi</span><span className="font-semibold">{shipmentType}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Hedef</span><span className="font-semibold">{selectedCountryName} ({receiverPostalCode})</span></div>
                {shipmentType !== "Belge" && (
                  <div className="flex justify-between"><span className="text-slate-500">Paket</span><span className="font-semibold">{w}x{l}x{h} cm, {kg} kg × {cnt}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-500">Ücret. Ağırlık</span><span className="font-semibold">{chargeableWeight.toFixed(2)} kg</span></div>

                <div className="border-t border-slate-100 pt-2">
                  <div className="flex justify-between"><span className="text-slate-500">Kargo</span><span className="font-semibold">{selectedQuote?.carrierName} {selectedQuote?.serviceName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Kargo Ücreti</span><span className="font-semibold">{selectedQuote?.priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span></div>
                  {hasInsurance && <div className="flex justify-between"><span className="text-slate-500">Sigorta</span><span className="font-semibold">52,20 ₺</span></div>}
                </div>

                <div className="border-t border-slate-100 pt-2">
                  <div className="flex justify-between"><span className="text-slate-500">Proforma</span><span className="font-semibold">{productDescription}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Toplam Değer</span><span className="font-semibold">{(parseInt(productQuantity || "1") * parseFloat(productUnitPrice || "0")).toFixed(2)} {proformaCurrency}</span></div>
                </div>

                <div className="border-t-2 border-blue-100 pt-2">
                  <div className="flex justify-between text-[14px]">
                    <span className="font-bold text-slate-800">Toplam</span>
                    <span className="font-bold text-blue-600">{totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 shrink-0 flex items-center gap-2">
        {step > 0 && (
          <button onClick={() => { setStep(s => s - 1); setError(null); }}
            className="h-9 px-3 rounded-lg text-[12px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Geri
          </button>
        )}
        <div className="flex-1" />
        {step < 5 ? (
          <button onClick={goNext} disabled={loading}
            className="h-9 px-4 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #3d6bff 0%, #2247e6 100%)" }}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>İleri <ArrowRight className="h-3.5 w-3.5" /></>}
          </button>
        ) : (
          <button onClick={handleCreate} disabled={loading}
            className="h-9 px-4 rounded-lg text-[12px] font-bold text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5" /> Onayla ve Oluştur</>}
          </button>
        )}
      </div>
    </div>
  );
}
