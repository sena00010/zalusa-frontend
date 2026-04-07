"use client";

import React from "react";
import { DollarSign, Save, RefreshCw, TrendingUp, AlertCircle } from "lucide-react";
import { adminService, type ExchangeRate } from "@/lib/services/adminService";

// ═══════════════════════════════════════════════════════════════════════════════
// Admin Kur Ayarları Sayfası
// TCMB (Merkez Bankası) kurlarını gösterir ve markup (fark) yönetimi sağlar.
// final_rate = rate + markup — müşteriye yansıyan kur budur.
// ═══════════════════════════════════════════════════════════════════════════════

// Para birimi etiketleri ve bayrak emojileri
const currencyMeta: Record<string, { label: string; flag: string }> = {
  USD: { label: "Amerikan Doları", flag: "🇺🇸" },
  EUR: { label: "Euro", flag: "🇪🇺" },
  GBP: { label: "İngiliz Sterlini", flag: "🇬🇧" },
};

export default function ExchangeRatesPage() {
  const [rates, setRates] = React.useState<ExchangeRate[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Her kur için düzenlenen markup değeri (id → değer)
  const [editingMarkup, setEditingMarkup] = React.useState<Record<number, number>>({});
  const [savingId, setSavingId] = React.useState<number | null>(null);

  // Senkronizasyon durumu
  const [syncing, setSyncing] = React.useState(false);
  const [syncMsg, setSyncMsg] = React.useState<string | null>(null);

  // Hata ve başarı mesajları
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // ── Kurları yükle ────────────────────────────────────────────────────────
  async function load() {
    try {
      const data = await adminService.listExchangeRates();
      setRates(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  // Mesajları otomatik temizle
  React.useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  React.useEffect(() => {
    if (syncMsg) {
      const t = setTimeout(() => setSyncMsg(null), 5000);
      return () => clearTimeout(t);
    }
  }, [syncMsg]);

  // ── Markup kaydet ────────────────────────────────────────────────────────
  async function saveMarkup(id: number) {
    const newMarkup = editingMarkup[id];
    if (newMarkup === undefined) return;

    setSavingId(id);
    setErrorMsg(null);
    try {
      await adminService.updateExchangeRateMarkup(id, { markup: newMarkup });
      await load();
      setEditingMarkup((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSuccessMsg("Döviz farkı güncellendi");
    } catch (err: any) {
      setErrorMsg(err.message || "Markup güncellenemedi.");
    } finally {
      setSavingId(null);
    }
  }

  // ── TCMB'den Senkronize Et ──────────────────────────────────────────────
  async function syncNow() {
    setSyncing(true);
    setSyncMsg(null);
    setErrorMsg(null);
    try {
      await adminService.syncExchangeRates();
      await load();
      const now = new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setSyncMsg(`TCMB kurları güncellendi — ${now}`);
    } catch (err: any) {
      setErrorMsg(err.message || "TCMB senkronizasyonu başarısız.");
    } finally {
      setSyncing(false);
    }
  }

  // ── Loading Skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Kur Ayarları</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Başlık ve TCMB Senkronize Butonu ─────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kur Ayarları</h1>
          <p className="mt-1 text-sm text-slate-500">
            TCMB Merkez Bankası kurları otomatik güncellenir (saatlik) — farkı
            (markup) admin olarak yönetebilirsiniz
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={syncNow}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            <RefreshCw
              className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Güncelleniyor..." : "TCMB'den Güncelle"}
          </button>
          {syncMsg && (
            <span className="text-xs text-emerald-600 font-medium">
              ✓ {syncMsg}
            </span>
          )}
        </div>
      </div>

      {/* ── Bilgi Kartı ───────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
        <TrendingUp className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
        <div className="text-sm text-indigo-700">
          <strong>Nasıl çalışır?</strong> Merkez Bankası kuru otomatik
          güncellenir. &quot;Eklenen Fark&quot; alanına yazdığınız değer kurla
          toplanarak &quot;Müşteriye Yansıyan Kur&quot;u oluşturur.
          <br />
          <span className="text-indigo-500">
            Örnek: MB Kuru 44.51 + Fark 0.50 = Müşteri Kuru 45.01
          </span>
        </div>
      </div>

      {/* ── Hata Mesajı ───────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="ml-auto shrink-0 hover:opacity-70 text-red-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Başarı Mesajı ─────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-600">
          <span>✓ {successMsg}</span>
        </div>
      )}

      {/* ── Kur Tablosu ───────────────────────────────────────────────────── */}
      {rates.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-100">
          <DollarSign className="inline-block h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            Henüz döviz kuru tanımlı değil
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
          {/* Tablo Başlığı */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Döviz Cinsi
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
              Merkez Bankası Kuru
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
              Eklenen Fark (Markup)
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
              Müşteriye Yansıyan Kur
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center w-20">
              İşlem
            </span>
          </div>

          {/* Kur Satırları */}
          {rates.map((r) => {
            const meta = currencyMeta[r.fromCurrency] || {
              label: r.fromCurrency,
              flag: "💱",
            };
            const isEditing = r.id in editingMarkup;
            const currentMarkup = isEditing ? editingMarkup[r.id] : (r.markup ?? 0);
            const previewFinal = (r.rate ?? 0) + currentMarkup;

            return (
              <div
                key={r.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-3 sm:gap-4 px-5 py-4 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors"
              >
                {/* Döviz Cinsi */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg">
                    {meta.flag}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {r.fromCurrency} → {r.toCurrency}
                    </div>
                    <div className="text-xs text-slate-400">{meta.label}</div>
                  </div>
                </div>

                {/* Merkez Bankası Kuru (sadece okunur) */}
                <div className="text-right">
                  <span className="sm:hidden text-xs text-slate-400 mr-2">
                    MB Kuru:
                  </span>
                  <span className="text-sm font-semibold text-slate-700 tabular-nums">
                    ₺{r.rate.toFixed(4)}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(r.updatedAt).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {/* Eklenen Fark (Markup) — DÜZENLENEBILIR */}
                <div className="flex items-center justify-end gap-1.5">
                  <span className="sm:hidden text-xs text-slate-400 mr-1">
                    Fark:
                  </span>
                  <span className="text-slate-400 text-sm">+</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentMarkup}
                    onChange={(e) =>
                      setEditingMarkup((prev) => ({
                        ...prev,
                        [r.id]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                {/* Müşteriye Yansıyan Kur (hesaplanmış) */}
                <div className="text-right">
                  <span className="sm:hidden text-xs text-slate-400 mr-2">
                    Müşteri Kuru:
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      isEditing ? "text-indigo-600" : "text-emerald-600"
                    }`}
                  >
                    ₺{previewFinal.toFixed(4)}
                  </span>
                </div>

                {/* Kaydet Butonu */}
                <div className="flex justify-center w-20">
                  {isEditing ? (
                    <button
                      onClick={() => saveMarkup(r.id)}
                      disabled={savingId === r.id}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {savingId === r.id ? "..." : "Kaydet"}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
