"use client";

import React from "react";
import {
  Building2,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  MapPin,
  DollarSign,
  FileSpreadsheet,
} from "lucide-react";
import {
  adminService,
  type Carrier,
  type CarrierRate,
  type CarrierZone,
} from "@/lib/services/adminService";
import ExcelUploader from "@/components/admin/ExcelUploader";

// ── Modal Component ─────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${
          wide ? "max-w-3xl" : "max-w-lg"
        } max-h-[85vh] overflow-auto rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100`}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Rate Form ───────────────────────────────────────────────────────────────

function RateForm({
  carrierId,
  initial,
  onSaved,
  onCancel,
}: {
  carrierId: string;
  initial?: CarrierRate;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState({
    zone: initial?.zone ?? "",
    weightMinKg: initial?.weightMinKg ?? 0,
    weightMaxKg: initial?.weightMaxKg ?? 0,
    basePrice: initial?.basePrice ?? 0,
    perKgPrice: initial?.perKgPrice ?? 0,
    currency: initial?.currency ?? "USD",
    fuelSurchargePct: initial?.fuelSurchargePct ?? 0,
    minTransitDays: initial?.minTransitDays ?? 1,
    maxTransitDays: initial?.maxTransitDays ?? 5,
    validFrom: initial?.validFrom ?? new Date().toISOString().slice(0, 10),
    validTo: initial?.validTo ?? "",
  });
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  function update(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      const payload = {
        ...form,
        validTo: form.validTo || null,
      } as any;
      if (initial) {
        await adminService.updateCarrierRate(initial.id, payload);
      } else {
        await adminService.createCarrierRate(carrierId, payload);
      }
      onSaved();
    } catch (err: any) {
      setFormError(err.message || "İşlem başarısız.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          <span>{formError}</span>
          <button type="button" onClick={() => setFormError(null)} className="ml-auto shrink-0 hover:opacity-70 text-red-400">✕</button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Zone</label>
          <input className={inputCls} value={form.zone} onChange={(e) => update("zone", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Para Birimi</label>
          <select className={inputCls} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
            {["USD", "EUR", "GBP", "TRY"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Min Ağırlık (kg)</label>
          <input className={inputCls} type="number" step="0.01" value={form.weightMinKg} onChange={(e) => update("weightMinKg", +e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Max Ağırlık (kg)</label>
          <input className={inputCls} type="number" step="0.01" value={form.weightMaxKg} onChange={(e) => update("weightMaxKg", +e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Baz Fiyat</label>
          <input className={inputCls} type="number" step="0.01" value={form.basePrice} onChange={(e) => update("basePrice", +e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Kg Başı Fiyat</label>
          <input className={inputCls} type="number" step="0.01" value={form.perKgPrice} onChange={(e) => update("perKgPrice", +e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Yakıt Ek (%)</label>
          <input className={inputCls} type="number" step="0.1" value={form.fuelSurchargePct} onChange={(e) => update("fuelSurchargePct", +e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Min Teslimat (gün)</label>
          <input className={inputCls} type="number" value={form.minTransitDays} onChange={(e) => update("minTransitDays", +e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Max Teslimat (gün)</label>
          <input className={inputCls} type="number" value={form.maxTransitDays} onChange={(e) => update("maxTransitDays", +e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Geçerlilik Başlangıç</label>
          <input className={inputCls} type="date" value={form.validFrom} onChange={(e) => update("validFrom", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Geçerlilik Bitiş</label>
          <input className={inputCls} type="date" value={form.validTo} onChange={(e) => update("validTo", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          İptal
        </button>
        <button type="submit" disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {busy ? "Kaydediliyor..." : initial ? "Güncelle" : "Ekle"}
        </button>
      </div>
    </form>
  );
}

// ── Zone Form ───────────────────────────────────────────────────────────────

function ZoneForm({
  carrierId,
  onSaved,
  onCancel,
}: {
  carrierId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState({
    originCountry: "",
    destCountry: "",
    destPostalPrefix: "",
    zone: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      await adminService.createCarrierZone(carrierId, {
        originCountry: form.originCountry,
        destCountry: form.destCountry,
        destPostalPrefix: form.destPostalPrefix || null,
        zone: form.zone,
      });
      onSaved();
    } catch (err: any) {
      setFormError(err.message || "İşlem başarısız.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          <span>{formError}</span>
          <button type="button" onClick={() => setFormError(null)} className="ml-auto shrink-0 hover:opacity-70 text-red-400">✕</button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Çıkış Ülkesi</label>
          <input className={inputCls} value={form.originCountry} onChange={(e) => update("originCountry", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Varış Ülkesi</label>
          <input className={inputCls} value={form.destCountry} onChange={(e) => update("destCountry", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Posta Kodu Prefix</label>
          <input className={inputCls} value={form.destPostalPrefix} onChange={(e) => update("destPostalPrefix", e.target.value)} placeholder="Opsiyonel" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Zone</label>
          <input className={inputCls} value={form.zone} onChange={(e) => update("zone", e.target.value)} required />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          İptal
        </button>
        <button type="submit" disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {busy ? "Kaydediliyor..." : "Ekle"}
        </button>
      </div>
    </form>
  );
}

// ── Excel Column Maps ───────────────────────────────────────────────────────

const RATE_COLUMNS = [
  { excelHeader: "zone", field: "zone" as const, type: "string" as const },
  { excelHeader: "weightMinKg", field: "weightMinKg" as const, type: "number" as const },
  { excelHeader: "weightMaxKg", field: "weightMaxKg" as const, type: "number" as const },
  { excelHeader: "basePrice", field: "basePrice" as const, type: "number" as const },
  { excelHeader: "perKgPrice", field: "perKgPrice" as const, type: "number" as const },
  { excelHeader: "currency", field: "currency" as const, type: "string" as const },
  { excelHeader: "fuelSurchargePct", field: "fuelSurchargePct" as const, type: "number" as const },
  { excelHeader: "minTransitDays", field: "minTransitDays" as const, type: "number" as const },
  { excelHeader: "maxTransitDays", field: "maxTransitDays" as const, type: "number" as const },
  { excelHeader: "validFrom", field: "validFrom" as const, type: "string" as const },
  { excelHeader: "validTo", field: "validTo" as const, type: "string" as const },
];

const ZONE_COLUMNS = [
  { excelHeader: "originCountry", field: "originCountry" as const, type: "string" as const },
  { excelHeader: "destCountry", field: "destCountry" as const, type: "string" as const },
  { excelHeader: "destPostalPrefix", field: "destPostalPrefix" as const, type: "string" as const },
  { excelHeader: "zone", field: "zone" as const, type: "string" as const },
];

// ── Carrier Detail (Rates + Zones) ──────────────────────────────────────────

function CarrierDetail({ carrier: initialCarrier, onCarrierUpdated }: { carrier: Carrier; onCarrierUpdated?: (updated: Carrier) => void }) {
  const [carrier, setCarrier] = React.useState(initialCarrier);
  const [expanded, setExpanded] = React.useState(false);
  const [tab, setTab] = React.useState<"rates" | "zones">("rates");
  const [rates, setRates] = React.useState<CarrierRate[]>([]);
  const [zones, setZones] = React.useState<CarrierZone[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [showRateForm, setShowRateForm] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<CarrierRate | undefined>();
  const [showZoneForm, setShowZoneForm] = React.useState(false);
  const [showRateExcel, setShowRateExcel] = React.useState(false);
  const [showZoneExcel, setShowZoneExcel] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [confirmAction, setConfirmAction] = React.useState<{ label: string; action: () => Promise<void> } | null>(null);

  async function loadDetails() {
    const [r, z] = await Promise.all([
      adminService.listCarrierRates(carrier.id).catch(() => []),
      adminService.listCarrierZones(carrier.id).catch(() => []),
    ]);
    setRates(Array.isArray(r) ? r : []);
    setZones(Array.isArray(z) ? z : []);
    setLoaded(true);
  }

  function toggleExpand() {
    if (!expanded && !loaded) loadDetails();
    setExpanded((p) => !p);
  }

  function confirmDeleteRate(id: number) {
    setConfirmAction({
      label: "Bu fiyatı silmek istediğinize emin misiniz?",
      action: async () => {
        try {
          await adminService.deleteCarrierRate(id);
          setRates((prev) => prev.filter((r) => r.id !== id));
        } catch (err: any) {
          setErrorMsg(err.message || "Silme başarısız.");
        }
        setConfirmAction(null);
      },
    });
  }

  function confirmDeleteZone(id: number) {
    setConfirmAction({
      label: "Bu bölgeyi silmek istediğinize emin misiniz?",
      action: async () => {
        try {
          await adminService.deleteCarrierZone(id);
          setZones((prev) => prev.filter((z) => z.id !== id));
        } catch (err: any) {
          setErrorMsg(err.message || "Silme başarısız.");
        }
        setConfirmAction(null);
      },
    });
  }

  async function toggleActive() {
    setErrorMsg(null);
    try {
      await adminService.updateCarrierStatus(carrier.id, { isActive: !carrier.isActive });
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message || "Durum güncellenemedi.");
    }
  }

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={toggleExpand}>
        <div className="flex items-center gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm overflow-hidden"
            style={{ backgroundColor: carrier.logoUrl ? "#f8fafc" : (carrier.logoColor || "#6366f1") }}
          >
            {carrier.logoUrl
              ? <img src={carrier.logoUrl} alt={carrier.carrierName} className="w-full h-full object-contain p-1" />
              : <span className="text-sm font-bold text-white">{carrier.logoLetter}</span>}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">{carrier.carrierName}</div>
            <div className="text-xs text-slate-500">{carrier.serviceName}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
            className="rounded-full px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <Edit3 className="inline h-3 w-3 mr-1" />Düzenle
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleActive(); }}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              carrier.isActive ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-red-50 text-red-500 hover:bg-red-100"
            }`}
          >
            {carrier.isActive ? "Aktif" : "Pasif"}
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="mx-5 mb-2 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto shrink-0 hover:opacity-70 text-red-400">✕</button>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100 text-center">
            <p className="text-sm text-slate-700 mb-5">{confirmAction.label}</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setConfirmAction(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                İptal
              </button>
              <button onClick={confirmAction.action} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Carrier Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Kargo Şirketini Düzenle">
        <EditCarrierForm
          carrier={carrier}
          onSaved={(updated) => {
            setCarrier(updated);
            onCarrierUpdated?.(updated);
            setShowEditModal(false);
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-100 p-5">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 mb-5">
            <button
              onClick={() => setTab("rates")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === "rates" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <DollarSign className="inline h-3.5 w-3.5 mr-1" />
              Fiyatlar ({rates.length})
            </button>
            <button
              onClick={() => setTab("zones")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === "zones" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <MapPin className="inline h-3.5 w-3.5 mr-1" />
              Bölgeler ({zones.length})
            </button>
          </div>

          {/* ── RATES TAB ── */}
          {tab === "rates" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-700">Fiyat Listesi</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRateExcel(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Excel Yükle
                  </button>
                  <button
                    onClick={() => { setEditingRate(undefined); setShowRateForm(true); }}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ekle
                  </button>
                </div>
              </div>
              {rates.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">Henüz fiyat tanımı yok</div>
              ) : (
                <div className="space-y-2">
                  {rates.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div className="text-xs space-y-0.5">
                        <div className="font-semibold text-slate-700">
                          Zone: {r.zone} | {r.weightMinKg}-{r.weightMaxKg} kg
                        </div>
                        <div className="text-slate-500">
                          {r.basePrice} {r.currency} + {r.perKgPrice}/kg | {r.minTransitDays}-{r.maxTransitDays} gün
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setEditingRate(r); setShowRateForm(true); }}
                          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                        </button>
                        <button
                          onClick={() => confirmDeleteRate(r.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rate Tek Ekleme Modal */}
              <Modal
                open={showRateForm}
                onClose={() => setShowRateForm(false)}
                title={editingRate ? "Fiyat Düzenle" : "Yeni Fiyat"}
              >
                <RateForm
                  carrierId={carrier.id}
                  initial={editingRate}
                  onSaved={() => { setShowRateForm(false); loadDetails(); }}
                  onCancel={() => setShowRateForm(false)}
                />
              </Modal>

              {/* Rate Excel Yükleme Modal */}
              <Modal
                open={showRateExcel}
                onClose={() => setShowRateExcel(false)}
                title="Excel'den Fiyat Yükle"
                wide
              >
                <ExcelUploader
                  label="Fiyatlar"
                  columnMap={RATE_COLUMNS}
                  onRowSubmit={async (row: any) => {
                    await adminService.createCarrierRate(carrier.id, {
                      zone: row.zone,
                      weightMinKg: row.weightMinKg,
                      weightMaxKg: row.weightMaxKg,
                      basePrice: row.basePrice,
                      perKgPrice: row.perKgPrice,
                      currency: row.currency || "USD",
                      fuelSurchargePct: row.fuelSurchargePct,
                      minTransitDays: row.minTransitDays,
                      maxTransitDays: row.maxTransitDays,
                      validFrom: row.validFrom,
                      validTo: row.validTo || null,
                    });
                  }}
                  onComplete={() => {
                    setShowRateExcel(false);
                    loadDetails();
                  }}
                  onClose={() => setShowRateExcel(false)}
                />
              </Modal>
            </div>
          )}

          {/* ── ZONES TAB ── */}
          {tab === "zones" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-700">Bölge Listesi</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowZoneExcel(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Excel Yükle
                  </button>
                  <button
                    onClick={() => setShowZoneForm(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ekle
                  </button>
                </div>
              </div>
              {zones.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">Henüz bölge tanımı yok</div>
              ) : (
                <div className="space-y-2">
                  {zones.map((z) => (
                    <div key={z.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div className="text-xs space-y-0.5">
                        <div className="font-semibold text-slate-700">
                          {z.originCountry} → {z.destCountry}
                        </div>
                        <div className="text-slate-500">
                          Zone: {z.zone}
                          {z.destPostalPrefix && ` | Posta: ${z.destPostalPrefix}`}
                        </div>
                      </div>
                      <button
                        onClick={() => confirmDeleteZone(z.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Zone Tek Ekleme Modal */}
              <Modal
                open={showZoneForm}
                onClose={() => setShowZoneForm(false)}
                title="Yeni Bölge"
              >
                <ZoneForm
                  carrierId={carrier.id}
                  onSaved={() => { setShowZoneForm(false); loadDetails(); }}
                  onCancel={() => setShowZoneForm(false)}
                />
              </Modal>

              {/* Zone Excel Yükleme Modal */}
              <Modal
                open={showZoneExcel}
                onClose={() => setShowZoneExcel(false)}
                title="Excel'den Bölge Yükle"
                wide
              >
                <ExcelUploader
                  label="Bölgeler"
                  columnMap={ZONE_COLUMNS}
                  onRowSubmit={async (row: any) => {
                    await adminService.createCarrierZone(carrier.id, {
                      originCountry: row.originCountry,
                      destCountry: row.destCountry,
                      destPostalPrefix: row.destPostalPrefix || null,
                      zone: row.zone,
                    });
                  }}
                  onComplete={() => {
                    setShowZoneExcel(false);
                    loadDetails();
                  }}
                  onClose={() => setShowZoneExcel(false)}
                />
              </Modal>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── New Carrier Form ─────────────────────────────────────────────────────────

const LOGO_COLORS = [
  "#4D148C", "#351C15", "#D40511", "#E30613", "#003B7A",
  "#00843D", "#0033A0", "#6366f1", "#0ea5e9", "#f59e0b",
  "#10b981", "#ef4444", "#8b5cf6", "#64748b",
];

function NewCarrierForm({ onSaved, onCancel }: { onSaved: (carrier: Carrier) => void; onCancel: () => void }) {
  const [form, setForm] = React.useState({
    carrierName: "", serviceName: "", id: "",
    logoColor: "#6366f1", logoLetter: "",
  });
  const [logoMode, setLogoMode] = React.useState<"letter" | "image">("letter");
  const [logoImageBase64, setLogoImageBase64] = React.useState<string>("");
  const [logoImageName, setLogoImageName] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function update(key: string, value: string) {
    setForm(p => {
      const next = { ...p, [key]: value };
      // Şirket adı değişince ID'yi otomatik güncelle
      if (key === "carrierName") {
        // Sadece ID hiç değiştirilmediyse ya da hâlâ addan türetilmişse otomatik güncelle
        next.id = toSlug(value);
        if (!next.logoLetter) next.logoLetter = value.slice(0, 1).toUpperCase();
      }
      return next;
    });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoImageBase64(ev.target?.result as string);
      setLogoImageName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.id || !form.carrierName || !form.serviceName || !form.logoColor) {
      setFormError("Şirket adı, hizmet adı ve renk zorunludur."); return;
    }
    if (logoMode === "image" && !logoImageBase64) {
      setFormError("Lütfen bir logo görseli yükleyin veya 'Harf' moduna geçin."); return;
    }
    setBusy(true);
    try {
      const payload = {
        id: form.id,
        carrierName: form.carrierName,
        serviceName: form.serviceName,
        logoColor: form.logoColor,
        logoLetter: form.logoLetter || form.carrierName.slice(0, 1).toUpperCase(),
        ...(logoMode === "image" && logoImageBase64 ? { logoUrl: logoImageBase64 } : {}),
      };
      await adminService.createCarrier(payload);
      const newCarrier: Carrier = {
        id: form.id, carrierName: form.carrierName, serviceName: form.serviceName,
        logoLetter: payload.logoLetter, logoColor: form.logoColor,
        logoUrl: logoMode === "image" ? logoImageBase64 : "",
        isActive: true, createdAt: new Date().toISOString(),
      };
      onSaved(newCarrier);
    } catch (err: any) {
      setFormError(err.message || "Kargo şirketi oluşturulamadı.");
    } finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all";

  // Önizleme içeriği
  const previewLogo = logoMode === "image" && logoImageBase64
    ? <img src={logoImageBase64} alt="logo" className="w-full h-full object-contain p-1" />
    : <span className="text-lg font-bold text-white">{form.logoLetter || form.carrierName.slice(0, 1).toUpperCase() || "?"}</span>;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {formError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          <span>{formError}</span>
          <button type="button" onClick={() => setFormError(null)} className="ml-auto shrink-0 hover:opacity-70 text-red-400">✕</button>
        </div>
      )}

      {/* Canlı Önizleme */}
      <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm overflow-hidden"
          style={{ backgroundColor: logoMode === "image" ? "#f8fafc" : form.logoColor }}
        >
          {previewLogo}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-800">{form.carrierName || "Şirket Adı"}</div>
          <div className="text-xs text-slate-500">{form.serviceName || "Hizmet Adı"}</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">{form.id || "id-slug"}</div>
        </div>
      </div>

      {/* Ana Alanlar */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Şirket Adı <span className="text-red-400">*</span></label>
          <input className={inputCls} value={form.carrierName}
            onChange={e => update("carrierName", e.target.value)}
            placeholder="DHL" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Hizmet Adı <span className="text-red-400">*</span></label>
          <input className={inputCls} value={form.serviceName}
            onChange={e => update("serviceName", e.target.value)}
            placeholder="DHL Express" required />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Şirket ID <span className="text-slate-400 font-normal">(benzersiz slug – otomatik oluşturulur)</span>
          </label>
          <input className={`${inputCls} font-mono`} value={form.id}
            onChange={e => setForm(p => ({ ...p, id: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
            placeholder="dhl-express" required />
        </div>
      </div>

      {/* Logo Bölümü */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Logo</span>
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            {(["letter", "image"] as const).map(mode => (
              <button key={mode} type="button" onClick={() => setLogoMode(mode)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${logoMode === mode ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
                {mode === "letter" ? "🔡 Harf" : "🖼 Görsel"}
              </button>
            ))}
          </div>
        </div>

        {logoMode === "letter" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Logo Harfi <span className="text-slate-400">(opsiyonel, otomatik türetilir)</span></label>
              <input className={inputCls} value={form.logoLetter}
                onChange={e => setForm(p => ({ ...p, logoLetter: e.target.value.slice(0, 1).toUpperCase() }))}
                placeholder={form.carrierName.slice(0, 1).toUpperCase() || "D"} maxLength={1} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Logo Rengi</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.logoColor}
                  onChange={e => setForm(p => ({ ...p, logoColor: e.target.value }))}
                  className="h-9 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5 shrink-0" />
                <input className={`${inputCls} font-mono`} value={form.logoColor}
                  onChange={e => setForm(p => ({ ...p, logoColor: e.target.value }))} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LOGO_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(p => ({ ...p, logoColor: c }))}
                    className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: form.logoColor === c ? "#1e293b" : "transparent" }} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {logoImageBase64 ? (
              <div className="flex items-center gap-3">
                <img src={logoImageBase64} alt="logo" className="h-14 w-14 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1" />
                <div>
                  <div className="text-sm font-medium text-slate-700">{logoImageName}</div>
                  <button type="button" onClick={() => { setLogoImageBase64(""); setLogoImageName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-xs text-red-500 hover:text-red-700 mt-0.5">Kaldır</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600">
                <svg className="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>PNG, JPG veya SVG yükleyin</span>
                <span className="text-xs text-slate-400">Önerilen: 128×128 veya daha büyük kare görsel</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          İptal
        </button>
        <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {busy ? "Oluşturuluyor..." : <><Plus className="h-4 w-4" />Oluştur</>}
        </button>
      </div>
    </form>
  );
}


// ── Edit Carrier Form ────────────────────────────────────────────────────────

function EditCarrierForm({ carrier, onSaved, onCancel }: { carrier: Carrier; onSaved: (updated: Carrier) => void; onCancel: () => void }) {
  const [form, setForm] = React.useState({
    carrierName: carrier.carrierName,
    serviceName: carrier.serviceName,
    logoColor: carrier.logoColor || "#6366f1",
    logoLetter: carrier.logoLetter || "",
  });
  const [logoMode, setLogoMode] = React.useState<"letter" | "image">(carrier.logoUrl ? "image" : "letter");
  const [logoImageBase64, setLogoImageBase64] = React.useState<string>(carrier.logoUrl || "");
  const [logoImageName, setLogoImageName] = React.useState<string>(carrier.logoUrl ? "Mevcut logo" : "");
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function update(key: string, value: string) {
    setForm(p => ({ ...p, [key]: value }));
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoImageBase64(ev.target?.result as string);
      setLogoImageName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.carrierName || !form.serviceName) {
      setFormError("Şirket adı ve hizmet adı zorunludur."); return;
    }
    if (logoMode === "image" && !logoImageBase64) {
      setFormError("Lütfen bir logo görseli yükleyin veya 'Harf' moduna geçin."); return;
    }
    setBusy(true);
    try {
      const payload: Record<string, string> = {
        carrierName: form.carrierName,
        serviceName: form.serviceName,
        logoColor: form.logoColor,
        logoLetter: form.logoLetter || form.carrierName.slice(0, 1).toUpperCase(),
      };
      if (logoMode === "image" && logoImageBase64) {
        payload.logoUrl = logoImageBase64;
      } else if (logoMode === "letter") {
        payload.logoUrl = "__REMOVE__";
      }
      await adminService.updateCarrier(carrier.id, payload);
      const updated: Carrier = {
        ...carrier,
        carrierName: form.carrierName,
        serviceName: form.serviceName,
        logoLetter: payload.logoLetter,
        logoColor: form.logoColor,
        logoUrl: logoMode === "image" ? logoImageBase64 : "",
      };
      onSaved(updated);
    } catch (err: any) {
      setFormError(err.message || "Güncelleme başarısız.");
    } finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all";

  const previewLogo = logoMode === "image" && logoImageBase64
    ? <img src={logoImageBase64} alt="logo" className="w-full h-full object-contain p-1" />
    : <span className="text-lg font-bold text-white">{form.logoLetter || form.carrierName.slice(0, 1).toUpperCase() || "?"}</span>;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {formError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          <span>{formError}</span>
          <button type="button" onClick={() => setFormError(null)} className="ml-auto shrink-0 hover:opacity-70 text-red-400">✕</button>
        </div>
      )}

      {/* Canlı Önizleme */}
      <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm overflow-hidden"
          style={{ backgroundColor: logoMode === "image" ? "#f8fafc" : form.logoColor }}
        >
          {previewLogo}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-800">{form.carrierName || "Şirket Adı"}</div>
          <div className="text-xs text-slate-500">{form.serviceName || "Hizmet Adı"}</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">{carrier.id}</div>
        </div>
      </div>

      {/* Ana Alanlar */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Şirket Adı <span className="text-red-400">*</span></label>
          <input className={inputCls} value={form.carrierName}
            onChange={e => update("carrierName", e.target.value)}
            placeholder="DHL" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Hizmet Adı <span className="text-red-400">*</span></label>
          <input className={inputCls} value={form.serviceName}
            onChange={e => update("serviceName", e.target.value)}
            placeholder="DHL Express" required />
        </div>
      </div>

      {/* Logo Bölümü */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Logo</span>
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            {(["letter", "image"] as const).map(mode => (
              <button key={mode} type="button" onClick={() => setLogoMode(mode)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${logoMode === mode ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
                {mode === "letter" ? "🔡 Harf" : "🖼 Görsel"}
              </button>
            ))}
          </div>
        </div>

        {logoMode === "letter" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Logo Harfi</label>
              <input className={inputCls} value={form.logoLetter}
                onChange={e => setForm(p => ({ ...p, logoLetter: e.target.value.slice(0, 1).toUpperCase() }))}
                placeholder={form.carrierName.slice(0, 1).toUpperCase() || "D"} maxLength={1} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Logo Rengi</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.logoColor}
                  onChange={e => setForm(p => ({ ...p, logoColor: e.target.value }))}
                  className="h-9 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5 shrink-0" />
                <input className={`${inputCls} font-mono`} value={form.logoColor}
                  onChange={e => setForm(p => ({ ...p, logoColor: e.target.value }))} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LOGO_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(p => ({ ...p, logoColor: c }))}
                    className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: form.logoColor === c ? "#1e293b" : "transparent" }} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {logoImageBase64 ? (
              <div className="flex items-center gap-3">
                <img src={logoImageBase64} alt="logo" className="h-14 w-14 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1" />
                <div>
                  <div className="text-sm font-medium text-slate-700">{logoImageName}</div>
                  <div className="flex gap-2 mt-0.5">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-indigo-500 hover:text-indigo-700">Değiştir</button>
                    <button type="button" onClick={() => { setLogoImageBase64(""); setLogoImageName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="text-xs text-red-500 hover:text-red-700">Kaldır</button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600">
                <svg className="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>PNG, JPG veya SVG yükleyin</span>
                <span className="text-xs text-slate-400">Önerilen: 128×128 veya daha büyük kare görsel</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          İptal
        </button>
        <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {busy ? "Kaydediliyor..." : <><Save className="h-4 w-4" />Kaydet</>}
        </button>
      </div>
    </form>
  );
}


// ── Page ─────────────────────────────────────────────────────────────────────

export default function CarriersPage() {
  const [carriers, setCarriers] = React.useState<Carrier[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNewModal, setShowNewModal] = React.useState(false);

  React.useEffect(() => {
    adminService
      .listCarriers()
      .then(setCarriers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Kargo Şirketleri</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kargo Şirketleri</h1>
          <p className="mt-1 text-sm text-slate-500">Kargo şirketlerini, fiyatları ve bölgeleri yönetin</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Yeni Kargo Şirketi
        </button>
      </div>

      {/* Yeni Kargo Şirketi Modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Yeni Kargo Şirketi Ekle">
        <NewCarrierForm
          onSaved={(newCarrier) => {
            setCarriers(prev => [newCarrier, ...prev]);
            setShowNewModal(false);
          }}
          onCancel={() => setShowNewModal(false)}
        />
      </Modal>

      {carriers.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-100">
          <Building2 className="inline-block h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">Henüz kargo şirketi yok</p>
          <button onClick={() => setShowNewModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            <Plus className="h-4 w-4" /> İlk Kargo Şirketini Ekle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {carriers.map((c) => (
            <CarrierDetail key={c.id} carrier={c} onCarrierUpdated={(updated) => setCarriers(prev => prev.map(p => p.id === updated.id ? updated : p))} />
          ))}
        </div>
      )}
    </div>
  );
}
