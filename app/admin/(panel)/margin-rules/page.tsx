"use client";

import React from "react";
import {
  Calculator,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Globe,
  Target,
  Percent,
  DollarSign,
} from "lucide-react";
import {
  adminService,
  type MarginRule,
  type Carrier,
} from "@/lib/services/adminService";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-[fadeInUp_0.3s_ease] max-w-sm">
      <div
        className={`flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-lg ring-1 ${
          type === "success"
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-red-50 text-red-700 ring-red-200"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 shrink-0 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
        <div className="mb-5 flex items-center justify-between">
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

// ── Form input class ─────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all";

const selectCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all appearance-none cursor-pointer";

// ── Default form state ───────────────────────────────────────────────────────

interface FormState {
  ruleType: "global" | "specific";
  carrierId: string;
  minDesi: string;
  maxDesi: string;
  marginType: "percentage" | "fixed";
  marginValue: string;
  isActive: boolean;
}

const defaultForm: FormState = {
  ruleType: "global",
  carrierId: "",
  minDesi: "",
  maxDesi: "",
  marginType: "percentage",
  marginValue: "",
  isActive: true,
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MarginRulesPage() {
  const [rules, setRules] = React.useState<MarginRule[]>([]);
  const [carriers, setCarriers] = React.useState<Carrier[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal state
  const [showModal, setShowModal] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<MarginRule | null>(null);
  const [form, setForm] = React.useState<FormState>(defaultForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = React.useState<MarginRule | null>(
    null
  );
  const [deleting, setDeleting] = React.useState(false);

  // ── Load data ────────────────────────────────────────────────────────────

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, carriersRes] = await Promise.allSettled([
        adminService.listMarginRules(),
        adminService.listCarriers(),
      ]);
      if (rulesRes.status === "fulfilled") {
        setRules(rulesRes.value.rules ?? []);
      } else {
        setRules([]);
      }
      if (carriersRes.status === "fulfilled") {
        const data = carriersRes.value;
        setCarriers(Array.isArray(data) ? data : []);
      }
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // ── Open create/edit modal ───────────────────────────────────────────────

  function openCreate() {
    setEditingRule(null);
    setForm(defaultForm);
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(rule: MarginRule) {
    setEditingRule(rule);
    setForm({
      ruleType: rule.ruleType,
      carrierId: rule.carrierId ?? "",
      minDesi: rule.minDesi != null ? String(rule.minDesi) : "",
      maxDesi: rule.maxDesi != null ? String(rule.maxDesi) : "",
      marginType: rule.marginType,
      marginValue: String(rule.marginValue),
      isActive: rule.isActive,
    });
    setFormError(null);
    setShowModal(true);
  }

  // ── Submit form ──────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const marginValue = parseFloat(form.marginValue);
    if (isNaN(marginValue) || marginValue <= 0) {
      setFormError("Marj değeri pozitif bir sayı olmalıdır.");
      return;
    }

    if (form.ruleType === "specific" && !form.carrierId) {
      setFormError("Spesifik kural için kargo firması seçilmelidir.");
      return;
    }

    const payload: any = {
      ruleType: form.ruleType,
      marginType: form.marginType,
      marginValue,
      isActive: form.isActive,
    };

    if (form.ruleType === "specific") {
      payload.carrierId = form.carrierId;
    } else {
      // Global ise carrier null
      payload.carrierId = null;
    }
    // Desi aralığı hem global hem specific için gönderilir
    if (form.minDesi) payload.minDesi = parseFloat(form.minDesi);
    if (form.maxDesi) payload.maxDesi = parseFloat(form.maxDesi);
    if (!form.minDesi) payload.minDesi = null;
    if (!form.maxDesi) payload.maxDesi = null;

    setSaving(true);
    try {
      if (editingRule) {
        await adminService.updateMarginRule(editingRule.id, payload);
        setToast({ type: "success", text: "Kural başarıyla güncellendi." });
      } else {
        await adminService.createMarginRule(payload);
        setToast({ type: "success", text: "Kural başarıyla oluşturuldu." });
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      setFormError(err.message || "İşlem başarısız.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteMarginRule(deleteTarget.id);
      setToast({ type: "success", text: "Kural silindi." });
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Silinemedi." });
    } finally {
      setDeleting(false);
    }
  }

  // ── Carrier name helper ──────────────────────────────────────────────────

  function getCarrierName(carrierId: string | null): string {
    if (!carrierId) return "—";
    const c = carriers.find((c) => c.id === carrierId);
    return c ? `${c.carrierName} (${c.serviceName})` : carrierId;
  }

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Fiyat & Marj Kuralları
        </h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Fiyat & Marj Kuralları
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kargo fiyatlarına uygulanacak kâr marjı kurallarını yönetin
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Yeni Kural
        </button>
      </div>

      {/* Info Card */}
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-5 py-4">
        <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
        <div className="text-sm text-indigo-700">
          <strong>Nasıl çalışır?</strong> &mdash; Kargo fiyatı hesaplandıktan
          sonra, önce <em>Spesifik</em> kural aranır (kargo firması + desi
          aralığı). Bulunamazsa <em>Global</em> kural uygulanır. Marj, ham
          fiyata eklenir ve ardından TRY&apos;ye çevrilir.
        </div>
      </div>

      {/* Rules Table */}
      {rules.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-100">
          <Calculator className="inline-block h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            Henüz marj kuralı eklenmemiş
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    Kural Tipi
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    Kargo Firması
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    Desi Aralığı
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    Marj Tipi
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    Marj Değeri
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    Durum
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    Tarih
                  </th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rules.map((r) => (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3.5">
                      {r.ruleType === "global" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 ring-1 ring-blue-200">
                          <Globe className="h-3 w-3" /> Global
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600 ring-1 ring-violet-200">
                          <Target className="h-3 w-3" /> Spesifik
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {r.ruleType === "specific"
                        ? r.carrierName || getCarrierName(r.carrierId)
                        : "Tüm Kargolar"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {r.minDesi != null || r.maxDesi != null
                        ? `${r.minDesi ?? 0} – ${r.maxDesi ?? "∞"} kg`
                        : "Tüm Desiler"}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.marginType === "percentage" ? (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Percent className="h-3.5 w-3.5 text-amber-500" />{" "}
                          Yüzde
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />{" "}
                          Sabit
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {r.marginType === "percentage"
                        ? `%${r.marginValue}`
                        : `${r.marginValue}`}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                          Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(r)}
                          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100 transition-colors"
                          title="Düzenle"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-500" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-red-50 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {rules.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {r.ruleType === "global" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 ring-1 ring-blue-200">
                        <Globe className="h-3 w-3" /> Global
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600 ring-1 ring-violet-200">
                        <Target className="h-3 w-3" /> Spesifik
                      </span>
                    )}
                    {r.isActive ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                        Aktif
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
                        Pasif
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(r)}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100"
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {r.ruleType === "specific" && (
                    <div>
                      <span className="text-slate-400">Kargo:</span>
                      <span className="ml-1 font-medium text-slate-700">
                        {r.carrierName || getCarrierName(r.carrierId)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Desi:</span>
                    <span className="ml-1 font-medium text-slate-700">
                      {r.minDesi != null || r.maxDesi != null
                        ? `${r.minDesi ?? 0} – ${r.maxDesi ?? "∞"} kg`
                        : "Tüm Desiler"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Marj:</span>
                    <span className="ml-1 font-semibold text-slate-800">
                      {r.marginType === "percentage"
                        ? `%${r.marginValue}`
                        : `${r.marginValue}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Tip:</span>
                    <span className="ml-1 font-medium text-slate-700">
                      {r.marginType === "percentage" ? "Yüzde" : "Sabit"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══ Create / Edit Modal ═══════════════════════════════════════════ */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRule ? "Kuralı Düzenle" : "Yeni Kural Ekle"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          {/* Rule Type */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-500">
              Kural Tipi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    ruleType: "global",
                    carrierId: "",
                  }))
                }
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                  form.ruleType === "global"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <Globe className="h-4 w-4" /> Global
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, ruleType: "specific" }))
                }
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                  form.ruleType === "specific"
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <Target className="h-4 w-4" /> Spesifik
              </button>
            </div>
          </div>

          {/* Specific fields — carrier only visible when specific */}
          {form.ruleType === "specific" && (
            <div className="space-y-4 rounded-xl border border-violet-100 bg-violet-50/30 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Kargo Firması
                </label>
                <select
                  className={selectCls}
                  value={form.carrierId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, carrierId: e.target.value }))
                  }
                  required
                >
                  <option value="">Seçiniz...</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.carrierName} — {c.serviceName} ({c.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Desi Range — both global and specific */}
          <div className={`space-y-3 rounded-xl border p-4 ${
            form.ruleType === "global" 
              ? "border-blue-100 bg-blue-50/30" 
              : "border-violet-100 bg-violet-50/30"
          }`}>
            <label className="block text-xs font-semibold text-slate-600">
              Desi Aralığı (Opsiyonel)
            </label>
            <p className="text-xs text-slate-400">
              Boş bırakılırsa tüm desilere uygulanır.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Minimum Desi (kg)
                </label>
                <input
                  className={inputCls}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={form.minDesi}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, minDesi: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Maksimum Desi (kg)
                </label>
                <input
                  className={inputCls}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="∞"
                  value={form.maxDesi}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, maxDesi: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Margin Type */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-500">
              Marj Tipi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, marginType: "percentage" }))
                }
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                  form.marginType === "percentage"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <Percent className="h-4 w-4" /> Yüzde (%)
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, marginType: "fixed" }))
                }
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                  form.marginType === "fixed"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <DollarSign className="h-4 w-4" /> Sabit Tutar
              </button>
            </div>
          </div>

          {/* Margin Value */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Marj Değeri{" "}
              {form.marginType === "percentage"
                ? "(örn: 15 → %15)"
                : "(EUR/USD cinsinden)"}
            </label>
            <input
              className={inputCls}
              type="number"
              step="0.01"
              min="0"
              required
              placeholder={
                form.marginType === "percentage" ? "15" : "5.00"
              }
              value={form.marginValue}
              onChange={(e) =>
                setForm((p) => ({ ...p, marginValue: e.target.value }))
              }
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, isActive: !p.isActive }))
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${
                form.isActive ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-slate-700">
              {form.isActive ? "Aktif" : "Pasif"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving
                ? "Kaydediliyor..."
                : editingRule
                  ? "Güncelle"
                  : "Oluştur"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══ Delete Confirm Modal ══════════════════════════════════════════ */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Kuralı Sil"
      >
        <p className="text-sm text-slate-600">
          Bu marj kuralını silmek istediğinizden emin misiniz? Bu işlem geri
          alınamaz.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            İptal
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Siliniyor..." : "Sil"}
          </button>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.text}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
