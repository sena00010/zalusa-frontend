"use client";

import React from "react";
import {
  Settings,
  Save,
  Percent,
  AlertCircle,
  CheckCircle,
  Ticket,
  Plus,
  X,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Hash,
  Infinity,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  resellerService,
  ResellerCoupon,
} from "@/lib/services/resellerService";

// ═════════════════════════════════════════════════════════════════════════════
// Bayi Ayarları Sayfası — İndirim Oranı + Kupon Yönetimi
// ═════════════════════════════════════════════════════════════════════════════

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "ZLS-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function ResellerSettingsPage() {
  // ── İndirim Oranı State ─────────────────────────────────────────────────
  const [discountAllowance, setDiscountAllowance] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // ── Kupon Yönetimi State ────────────────────────────────────────────────
  const [coupons, setCoupons] = React.useState<ResellerCoupon[]>([]);
  const [couponsLoading, setCouponsLoading] = React.useState(true);
  const [showCouponModal, setShowCouponModal] = React.useState(false);

  // Modal form state
  const [couponCode, setCouponCode] = React.useState(generateCouponCode());
  const [couponDiscount, setCouponDiscount] = React.useState("");
  const [couponUsageLimit, setCouponUsageLimit] = React.useState("");
  const [couponExpiresAt, setCouponExpiresAt] = React.useState("");
  const [creatingCoupon, setCreatingCoupon] = React.useState(false);

  // ── Sayfa yükleme ───────────────────────────────────────────────────────
  React.useEffect(() => {
    setLoaded(true);
    loadCoupons();
  }, []);

  async function loadCoupons() {
    setCouponsLoading(true);
    try {
      const res = await resellerService.listCoupons();
      setCoupons(res.coupons || []);
    } catch {
      // İlk yüklemede hata olursa sessizce geç
    } finally {
      setCouponsLoading(false);
    }
  }

  // ── İndirim Oranı Submit ────────────────────────────────────────────────
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = parseFloat(discountAllowance);
    if (isNaN(value) || value < 0) {
      toast.error("Lütfen geçerli bir oran girin (0 veya üzeri)");
      return;
    }
    if (value > 100) {
      toast.error("İndirim oranı %100'ü geçemez");
      return;
    }

    setSaving(true);
    try {
      const res = await resellerService.updateSettings(value);
      toast.success(res.message || "İndirim oranı başarıyla güncellendi!", {
        icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
        duration: 3000,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bir hata oluştu";
      toast.error(msg, {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Kupon Oluşturma ─────────────────────────────────────────────────────
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const discount = parseFloat(couponDiscount);
    if (isNaN(discount) || discount <= 0) {
      toast.error("İndirim oranı 0'dan büyük olmalıdır");
      return;
    }
    if (discount > 100) {
      toast.error("İndirim oranı %100'ü geçemez");
      return;
    }
    if (!couponCode || couponCode.length < 3) {
      toast.error("Kupon kodu en az 3 karakter olmalıdır");
      return;
    }

    setCreatingCoupon(true);
    try {
      const payload: {
        code: string;
        discountPct: number;
        usageLimit?: number | null;
        expiresAt?: string | null;
      } = {
        code: couponCode,
        discountPct: discount,
      };

      // Kullanım limiti
      if (couponUsageLimit) {
        const limit = parseInt(couponUsageLimit, 10);
        if (!isNaN(limit) && limit > 0) {
          payload.usageLimit = limit;
        }
      }

      // Son kullanma tarihi
      if (couponExpiresAt) {
        payload.expiresAt = new Date(couponExpiresAt).toISOString();
      }

      const res = await resellerService.createCoupon(payload);
      toast.success(res.message || "Kupon başarıyla oluşturuldu!", {
        icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
        duration: 3000,
      });

      // Modal kapat ve resetle
      setShowCouponModal(false);
      setCouponCode(generateCouponCode());
      setCouponDiscount("");
      setCouponUsageLimit("");
      setCouponExpiresAt("");

      // Listeyi yenile
      loadCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kupon oluşturulamadı";
      toast.error(msg, {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        duration: 4000,
      });
    } finally {
      setCreatingCoupon(false);
    }
  };

  // ── Kupon Toggle ────────────────────────────────────────────────────────
  const handleToggleCoupon = async (coupon: ResellerCoupon) => {
    try {
      await resellerService.updateCouponStatus(coupon.id, !coupon.isActive);
      toast.success(
        coupon.isActive ? "Kupon pasife alındı" : "Kupon aktifleştirildi"
      );
      loadCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "İşlem başarısız";
      toast.error(msg);
    }
  };

  // ── Kupon Silme ─────────────────────────────────────────────────────────
  const handleDeleteCoupon = async (coupon: ResellerCoupon) => {
    if (!confirm(`"${coupon.code}" kuponunu silmek istediğinize emin misiniz?`))
      return;
    try {
      await resellerService.deleteCoupon(coupon.id);
      toast.success("Kupon silindi");
      loadCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Silme başarısız";
      toast.error(msg);
    }
  };

  // ── Loading State ───────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Bayi Ayarları</h1>
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast container */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "!rounded-xl !shadow-lg !ring-1 !ring-slate-100",
          style: { fontFamily: "inherit", fontSize: "14px" },
        }}
      />

      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bayi Ayarları</h1>
        <p className="mt-1 text-sm text-slate-500">
          İndirim oranınızı ve kuponlarınızı buradan yönetin
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* YAN YANA KARTLAR                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

      {/* ── İNDİRİM ORANI KARTI ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-8 ring-1 ring-slate-100 shadow-sm">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10" />

        <div className="relative">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Settings className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                İndirim Ayarları
              </h2>
              <p className="text-xs text-slate-500">
                Bu oran, sizin üzerinden gelen müşterilerin fiyatlarından
                düşülür
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-800">
                <strong>Not:</strong> İndirim oranınız, size tanımlanan komisyon
                oranından yüksek olamaz. Komisyon oranınızı aşan bir değer
                girerseniz sistem bunu reddedecektir.
              </p>
            </div>
          </div>

          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="discount-allowance"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Müşterilerinize Yansıtılacak İndirim Oranı (%)
              </label>
              <div className="relative">
                <input
                  id="discount-allowance"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={discountAllowance}
                  onChange={(e) => setDiscountAllowance(e.target.value)}
                  placeholder="Örn: 5.00"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  required
                  disabled={saving}
                />
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                  <Percent className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Örneğin %5 girerseniz, müşterileriniz her siparişte %5 indirim
                alır.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
            >
              {saving ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Kaydet
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── KUPON YÖNETİMİ KARTI ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-8 ring-1 ring-slate-100 shadow-sm">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 opacity-10" />

        <div className="relative">
          {/* Kupon başlık */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
                <Ticket className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Kupon Yönetimi
                </h2>
                <p className="text-xs text-slate-500">
                  Müşterilerinize özel indirim kuponları oluşturun
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setCouponCode(generateCouponCode());
                setCouponDiscount("");
                setCouponUsageLimit("");
                setCouponExpiresAt("");
                setShowCouponModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-purple-700 hover:to-pink-700 hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Yeni Kupon
            </button>
          </div>

          {/* Bilgi Notu */}
          <div className="mb-6 rounded-xl bg-blue-50 p-4 ring-1 ring-blue-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs leading-relaxed text-blue-800">
                <strong>Not:</strong> Oluşturduğunuz kuponların indirim bedeli,
                komisyon kazancınızdan karşılanacaktır. İndirim oranı komisyon
                hakkınızı aşamaz.
              </p>
            </div>
          </div>

          {/* Kupon Listesi */}
          {couponsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-slate-50"
                />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                <Ticket className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Henüz kupon oluşturmadınız
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Yeni kupon oluşturmak için yukarıdaki butonu kullanın
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Kupon Kodu
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      İndirim
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Kullanım
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Son Kullanma
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Durum
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {coupons.map((coupon) => {
                    const isExpired =
                      coupon.expiresAt &&
                      new Date(coupon.expiresAt) < new Date();
                    const limitReached =
                      coupon.usageLimit > 0 &&
                      coupon.usedCount >= coupon.usageLimit;

                    return (
                      <tr
                        key={coupon.id}
                        className="transition hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 font-mono text-xs font-bold text-purple-700">
                            <Hash className="h-3 w-3" />
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-900">
                            %{coupon.discountPct}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-slate-600">
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
                        <td className="px-4 py-3.5">
                          {coupon.expiresAt ? (
                            <span
                              className={`text-xs ${isExpired ? "text-red-500 font-medium" : "text-slate-600"}`}
                            >
                              {new Date(coupon.expiresAt).toLocaleDateString(
                                "tr-TR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                }
                              )}
                              {isExpired && " (Süresi dolmuş)"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <Infinity className="h-3 w-3" />
                              Süresiz
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              coupon.isActive && !isExpired && !limitReached
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                coupon.isActive && !isExpired && !limitReached
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {coupon.isActive && !isExpired && !limitReached
                              ? "Aktif"
                              : "Pasif"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleCoupon(coupon)}
                              title={
                                coupon.isActive ? "Pasife al" : "Aktifleştir"
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                            >
                              {coupon.isActive ? (
                                <ToggleRight className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon)}
                              title="Kuponu Sil"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

      </div>{/* grid kapanışı */}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* KUPON OLUŞTURMA MODALI                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-100">
            {/* Kapatma butonu */}
            <button
              onClick={() => setShowCouponModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal başlık */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <Ticket className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Yeni Kupon Oluştur
              </h3>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-5">
              {/* Kupon Kodu */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Kupon Kodu <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    placeholder="ZLS-XXXXX"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                    required
                    minLength={3}
                    maxLength={50}
                    disabled={creatingCoupon}
                  />
                  <button
                    type="button"
                    onClick={() => setCouponCode(generateCouponCode())}
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600"
                    title="Yeni kod oluştur"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Otomatik oluşturuldu, isterseniz değiştirebilirsiniz
                </p>
              </div>

              {/* İndirim Oranı */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  İndirim (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    value={couponDiscount}
                    onChange={(e) => setCouponDiscount(e.target.value)}
                    placeholder="5"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                    required
                    disabled={creatingCoupon}
                  />
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
                    <Percent className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Müşterilere uygulanacak indirim yüzdesi
                </p>
              </div>

              {/* Kullanım Limiti & Son Kullanma Tarihi */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Kullanım Limiti
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponUsageLimit}
                    onChange={(e) => setCouponUsageLimit(e.target.value)}
                    placeholder="Sınırsız"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                    disabled={creatingCoupon}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Boş bırakırsanız sınırsız
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Son Kullanma Tarihi
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={couponExpiresAt}
                      onChange={(e) => setCouponExpiresAt(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                      disabled={creatingCoupon}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Boş = süresiz
                  </p>
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  disabled={creatingCoupon}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creatingCoupon}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-purple-700 hover:to-pink-700 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creatingCoupon ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4" />
                      Kupon Oluştur
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
