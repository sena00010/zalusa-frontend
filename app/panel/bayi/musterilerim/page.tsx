"use client";

import React from "react";
import {
  Users,
  UserPlus,
  Link2,
  Package,
  Search,
  RefreshCcw,
  Mail,
  Phone,
  Calendar,
  X,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserMinus,
  AlertTriangle,
} from "lucide-react";
import {
  resellerService,
  type ResellerCustomer,
} from "@/lib/services/resellerService";

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// Müşterilerim Sayfası
// ═════════════════════════════════════════════════════════════════════════════

export default function ResellerCustomersPage() {
  const [customers, setCustomers] = React.useState<ResellerCustomer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Modallar
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showLinkModal, setShowLinkModal] = React.useState(false);

  // Toast mesajı
  const [toast, setToast] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Unlink modal state
  const [unlinkTarget, setUnlinkTarget] = React.useState<ResellerCustomer | null>(null);
  const [unlinking, setUnlinking] = React.useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Müşteri listesini yükle ─────────────────────────────────────────

  const fetchCustomers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await resellerService.listCustomers();
      setCustomers(res.customers || []);
    } catch {
      showToast("error", "Müşteri listesi yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Arama filtresi ──────────────────────────────────────────────────

  const filtered = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.customerId.toLowerCase().includes(term)
    );
  });

  // ── Müşteri çıkarma işlemi ─────────────────────────────────────────
  const handleUnlink = async () => {
    if (!unlinkTarget) return;
    setUnlinking(true);
    try {
      await resellerService.unlinkCustomer(unlinkTarget.id);
      showToast("success", `${unlinkTarget.firstName} ${unlinkTarget.lastName} bağlantısı çözüldü`);
      setUnlinkTarget(null);
      fetchCustomers();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setUnlinking(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Başlık + Aksiyonlar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Müşterilerim</h1>
          <p className="mt-1 text-sm text-slate-500">
            Bayinize bağlı müşterilerinizi görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLinkModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            <Link2 className="h-4 w-4" />
            Müşteri Bağla
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Yeni Müşteri
          </button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">
                {customers.length}
              </div>
              <div className="text-xs text-slate-500">Toplam Müşteri</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">
                {customers.filter((c) => c.isActive).length}
              </div>
              <div className="text-xs text-slate-500">Aktif Müşteri</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">
                {customers.reduce((sum, c) => sum + c.shipmentCount, 0)}
              </div>
              <div className="text-xs text-slate-500">Toplam Gönderi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Arama + Yenile */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Müşteri ara (isim, e-posta, müşteri no)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          onClick={fetchCustomers}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Müşteri Tablosu */}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm font-medium text-slate-400">
              {searchTerm
                ? "Arama kriterlerinize uygun müşteri bulunamadı"
                : "Henüz müşteriniz yok. Yeni bir müşteri oluşturun veya mevcut bir müşteriyi bağlayın."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Müşteri
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    İletişim
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Müşteri No
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Gönderiler
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Durum
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Kayıt Tarihi
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 transition hover:bg-blue-50/30"
                  >
                    {/* Müşteri */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                          {c.firstName.charAt(0)}
                          {c.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {c.firstName} {c.lastName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {c.kind === "corporate" ? "Kurumsal" : "Bireysel"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* İletişim */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {c.email}
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {c.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Müşteri No */}
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-semibold text-slate-600">
                        {c.customerId}
                      </span>
                    </td>

                    {/* Gönderiler */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">
                          {c.shipmentCount}
                        </span>
                      </div>
                    </td>

                    {/* Durum */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            c.isActive ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        {c.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>

                    {/* Tarih */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(c.createdAt)}
                      </div>
                    </td>

                    {/* İşlem */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setUnlinkTarget(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                        Çıkar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Yeni Müşteri Oluştur Modal ─────────────────────────────────── */}
      {showCreateModal && (
        <CreateCustomerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCustomers();
            showToast("success", "Müşteri başarıyla oluşturuldu");
          }}
          onError={(msg) => showToast("error", msg)}
        />
      )}

      {/* ── Müşteri Bağla Modal ────────────────────────────────────────── */}
      {showLinkModal && (
        <LinkCustomerModal
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => {
            setShowLinkModal(false);
            fetchCustomers();
            showToast("success", "Müşteri başarıyla bağlandı");
          }}
          onError={(msg) => showToast("error", msg)}
        />
      )}

      {/* ── Müşteri Çıkar Onay Modalı ──────────────────────────────────── */}
      {unlinkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <button
              onClick={() => setUnlinkTarget(null)}
              disabled={unlinking}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-5 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                <UserMinus className="h-7 w-7 text-red-500" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-slate-900">
              Müşteriyi Çıkar
            </h3>
            <p className="mb-4 text-center text-sm text-slate-500">
              <strong className="text-slate-800">
                {unlinkTarget.firstName} {unlinkTarget.lastName}
              </strong>{" "}
              adlı müşteriyi listenizden çıkarmak istediğinize emin misiniz?
            </p>
            <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-xs">
                  Müşterinin hesabı silinmez, sadece sizinle olan bağlantısı
                  çözülür. Müşteri artık bağımsız olarak sistemi kullanmaya devam
                  eder.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setUnlinkTarget(null)}
                disabled={unlinking}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                İptal
              </button>
              <button
                onClick={handleUnlink}
                disabled={unlinking}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              >
                {unlinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserMinus className="h-4 w-4" />
                )}
                {unlinking ? "İşleniyor..." : "Müşteriyi Çıkar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Yeni Müşteri Oluştur Modal
// ═════════════════════════════════════════════════════════════════════════════

function CreateCustomerModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [inlineError, setInlineError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setInlineError("Lütfen tüm zorunlu alanları doldurun");
      return;
    }
    if (form.password.length < 6) {
      setInlineError("Şifre en az 6 karakter olmalıdır");
      return;
    }

    setSubmitting(true);
    try {
      await resellerService.createCustomer(form);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Müşteri oluşturulamadı";
      setInlineError(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Yeni Müşteri Oluştur
              </h2>
              <p className="text-xs text-slate-500">
                Bu müşteri otomatik olarak size bağlanacaktır
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Inline Hata Mesajı */}
        {inlineError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <span>{inlineError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Ad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Ad"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Soyad"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              E-posta <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Telefon
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="+90 555 123 45 67"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Şifre <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="En az 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Müşteri Bağla Modal (Email + Doğrulama Kodu)
// ═════════════════════════════════════════════════════════════════════════════

function LinkCustomerModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [step, setStep] = React.useState<"email" | "verify">("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [inlineError, setInlineError] = React.useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    if (!email) {
      setInlineError("E-posta adresi giriniz");
      return;
    }

    setSubmitting(true);
    try {
      await resellerService.linkRequest(email);
      setStep("verify");
      setInlineError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Kod gönderilemedi";
      setInlineError(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    if (!code || code.length !== 6) {
      setInlineError("6 haneli doğrulama kodunu giriniz");
      return;
    }

    setSubmitting(true);
    try {
      await resellerService.linkVerify(email, code);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Doğrulama başarısız";
      setInlineError(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <Link2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Mevcut Müşteriyi Bağla
              </h2>
              <p className="text-xs text-slate-500">
                {step === "email"
                  ? "Müşterinin e-postasına doğrulama kodu gönderin"
                  : "Müşteriye gönderilen kodu girin"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Inline Hata Mesajı */}
        {inlineError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <span>{inlineError}</span>
          </div>
        )}

        {/* Step 1: E-posta Girişi */}
        {step === "email" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Müşterinin E-posta Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="musteri@email.com"
                autoFocus
              />
            </div>

            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                <strong>Not:</strong> Müşterinin e-posta adresine 6 haneli
                doğrulama kodu gönderilecektir. Müşteriden bu kodu alarak
                aşağıda girmeniz gerekecek.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Kod Gönder
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Kod Doğrulama */}
        {step === "verify" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">
                <strong>{email}</strong> adresine doğrulama kodu gönderildi.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Doğrulama Kodu (6 haneli)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-center text-lg font-bold tracking-[0.5em] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="••••••"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Geri
              </button>
              <button
                type="submit"
                disabled={submitting || code.length !== 6}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Doğrula ve Bağla
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
