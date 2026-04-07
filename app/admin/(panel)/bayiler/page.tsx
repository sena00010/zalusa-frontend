"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Wallet,
  TrendingUp,
  Percent,
  CreditCard,
  X,
  AlertTriangle,
  RefreshCcw,
  Plus,
  Crown,
  ChevronRight,
  UserMinus,
} from "lucide-react";
import {
  resellerService,
  type ResellerListItem,
} from "@/lib/services/resellerService";
import { adminService } from "@/lib/services/adminService";

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function formatCurrency(val: number): string {
  return val.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// Admin Bayi Yönetimi Sayfası
// ═════════════════════════════════════════════════════════════════════════════

export default function AdminResellersPage() {
  const router = useRouter();
  const [resellers, setResellers] = React.useState<ResellerListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Payout modal state
  const [payoutTarget, setPayoutTarget] = React.useState<ResellerListItem | null>(null);
  const [payingOut, setPayingOut] = React.useState(false);

  // Demote modal state
  const [demoteTarget, setDemoteTarget] = React.useState<ResellerListItem | null>(null);
  const [demoting, setDemoting] = React.useState(false);

  // Create reseller modal state
  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [createForm, setCreateForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    commissionRate: "15",
  });

  // ── Veri yükle ──────────────────────────────────────────────────────
  const fetchResellers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resellerService.adminListResellers();
      setResellers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bayiler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchResellers();
  }, [fetchResellers]);

  // ── Payout işlemi ───────────────────────────────────────────────────
  const handlePayout = async () => {
    if (!payoutTarget) return;
    setPayingOut(true);
    try {
      await resellerService.adminPayout(payoutTarget.id);
      setResellers((prev) =>
        prev.map((r) =>
          r.id === payoutTarget.id ? { ...r, balance: 0 } : r
        )
      );
      setPayoutTarget(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Ödeme başarısız");
    } finally {
      setPayingOut(false);
    }
  };

  // ── Bayiliği kaldır ─────────────────────────────────────────────────
  const handleDemote = async () => {
    if (!demoteTarget) return;
    setDemoting(true);
    try {
      await adminService.updateUserRole(demoteTarget.id, { role: "user" });
      // Listeden kaldır
      setResellers((prev) => prev.filter((r) => r.id !== demoteTarget.id));
      setDemoteTarget(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setDemoting(false);
    }
  };

  // ── Bayi oluştur ────────────────────────────────────────────────────
  const handleCreate = async () => {
    const rate = parseFloat(createForm.commissionRate);
    if (isNaN(rate) || rate <= 0 || rate > 100) {
      setCreateError("Komisyon oranı 0-100 arasında olmalıdır");
      return;
    }
    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password) {
      setCreateError("Tüm zorunlu alanları doldurun");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await adminService.createReseller({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email,
        phone: createForm.phone,
        password: createForm.password,
        commissionRate: rate,
      });
      setShowCreate(false);
      setCreateForm({ firstName: "", lastName: "", email: "", phone: "", password: "", commissionRate: "15" });
      fetchResellers();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Oluşturma başarısız");
    } finally {
      setCreating(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Bayi Yönetimi</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Bayi Yönetimi</h1>
        <div className="rounded-2xl bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={fetchResellers}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCcw className="h-4 w-4" /> Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // ── Özet kartları ───────────────────────────────────────────────────
  const totalBayiler = resellers.length;
  const totalBakiye = resellers.reduce((sum, r) => sum + r.balance, 0);
  const totalKazanc = resellers.reduce((sum, r) => sum + r.totalEarned, 0);

  const summaryCards = [
    { label: "Toplam Bayi", value: totalBayiler.toString(), icon: Users, color: "text-indigo-600", bgColor: "bg-indigo-50" },
    { label: "Toplam Bekleyen Bakiye", value: `${formatCurrency(totalBakiye)} ₺`, icon: Wallet, color: "text-amber-600", bgColor: "bg-amber-50" },
    { label: "Toplam Kazanç (Genel)", value: `${formatCurrency(totalKazanc)} ₺`, icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bayi Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500">Bayileri yönet, kupon tanımla ve ödemeleri takip et</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchResellers}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            <RefreshCcw className="h-4 w-4" /> Yenile
          </button>
          <button
            onClick={() => { setShowCreate(true); setCreateError(null); }}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" /> Yeni Bayi Oluştur
          </button>
        </div>
      </div>

      {/* ── Özet Kartları ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                <div className="text-xs font-medium text-slate-500">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bayi Tablosu ───────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Bayi Listesi</h2>
          <span className="text-xs font-medium text-slate-400">{totalBayiler} bayi</span>
        </div>

        {resellers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Crown className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-400">Henüz kayıtlı bayi bulunmuyor</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" /> İlk Bayiyi Oluştur
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Bayi</th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">E-posta</th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-1"><Percent className="h-3 w-3" />Komisyon</div>
                  </th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Toplam Kazanç</th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Bakiye</th>
                  <th className="whitespace-nowrap px-4 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {resellers.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 transition hover:bg-purple-50/40 cursor-pointer group">
                    {/* İsim - tıklanabilir */}
                    <td className="whitespace-nowrap px-4 py-3" onClick={() => router.push(`/admin/bayiler/${r.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 text-sm font-bold text-white">
                          {(r.firstName?.[0] || "B").toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">{r.firstName} {r.lastName}</span>
                          <ChevronRight className="ml-1 inline h-3.5 w-3.5 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500" onClick={() => router.push(`/admin/bayiler/${r.id}`)}>
                      {r.email}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-600">
                        %{r.commissionRate}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                      {formatCurrency(r.totalEarned)} ₺
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`text-sm font-bold ${r.balance > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                        {formatCurrency(r.balance)} ₺
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/bayiler/${r.id}`); }}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Detay
                        </button>
                        {r.balance > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setPayoutTarget(r); }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                          >
                            <CreditCard className="h-3.5 w-3.5" /> Ödeme
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setDemoteTarget(r); }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                        >
                          <UserMinus className="h-3.5 w-3.5" /> Bayiliği Kaldır
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Payout Onay Modalı ─────────────────────────────────────────── */}
      {payoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <button onClick={() => setPayoutTarget(null)} disabled={payingOut} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <div className="mb-5 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-slate-900">Ödeme Onayı</h3>
            <p className="mb-6 text-center text-sm text-slate-500">
              <strong className="text-slate-800">{payoutTarget.firstName} {payoutTarget.lastName}</strong>{" "}
              adlı bayiye <strong className="text-emerald-600">{formatCurrency(payoutTarget.balance)} ₺</strong>{" "}
              ödeme yapmak istediğinize emin misiniz?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPayoutTarget(null)} disabled={payingOut} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                İptal
              </button>
              <button onClick={handlePayout} disabled={payingOut} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60">
                {payingOut ? "İşleniyor..." : <><CreditCard className="h-4 w-4" /> Ödemeyi Onayla</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bayiliği Kaldır Onay Modalı ────────────────────────────────── */}
      {demoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <button onClick={() => setDemoteTarget(null)} disabled={demoting} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <div className="mb-5 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                <UserMinus className="h-7 w-7 text-red-500" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-slate-900">Bayiliği Kaldır</h3>
            <p className="mb-4 text-center text-sm text-slate-500">
              <strong className="text-slate-800">{demoteTarget.firstName} {demoteTarget.lastName}</strong>{" "}
              adlı bayi normal müşteriye düşürülecek.
            </p>
            <div className="mb-6 space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="font-semibold">Bu işlem sonucunda:</p>
                  <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                    <li>Bayiye bağlı tüm müşterilerin bağlantısı çözülecek</li>
                    <li>Bayinin tüm kuponları pasif yapılacak</li>
                    <li>Komisyon oranı sıfırlanacak</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDemoteTarget(null)} disabled={demoting} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                İptal
              </button>
              <button onClick={handleDemote} disabled={demoting} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60">
                {demoting ? "İşleniyor..." : <><UserMinus className="h-4 w-4" /> Bayiliği Kaldır</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Bayi Oluştur Modalı ───────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <button onClick={() => setShowCreate(false)} disabled={creating} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50">
                <Crown className="h-7 w-7 text-purple-500" />
              </div>
            </div>
            <h3 className="mb-6 text-center text-lg font-bold text-slate-900">Yeni Bayi Oluştur</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ad *</label>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                    disabled={creating}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Soyad *</label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                    disabled={creating}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">E-posta *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                  disabled={creating}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Telefon</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                  disabled={creating}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Şifre *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                  placeholder="Min 6 karakter"
                  disabled={creating}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Komisyon Oranı (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  value={createForm.commissionRate}
                  onChange={(e) => setCreateForm({ ...createForm, commissionRate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                  disabled={creating}
                />
                <p className="mt-1 text-xs text-slate-400">Her siparişten alacağı komisyon yüzdesi</p>
              </div>
            </div>

            {createError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-600">{createError}</div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowCreate(false)} disabled={creating} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                İptal
              </button>
              <button onClick={handleCreate} disabled={creating} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-60">
                {creating ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" /> Bayi Oluştur
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
