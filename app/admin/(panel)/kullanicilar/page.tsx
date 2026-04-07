"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  UsersRound,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Calendar,
  Hash,
  ShieldCheck,
  X,
  Crown,
} from "lucide-react";
import {
  adminService,
  type CustomerUser,
} from "@/lib/services/adminService";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = React.useState<CustomerUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const limit = 20;

  // Bayi Yap modal state
  const [promoteTarget, setPromoteTarget] = React.useState<CustomerUser | null>(null);
  const [commissionInput, setCommissionInput] = React.useState("15");
  const [promoting, setPromoting] = React.useState(false);
  const [promoteError, setPromoteError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.listUsers(page, limit, search);
      setUsers(data.users ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  React.useEffect(() => {
    load();
  }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function kindLabel(kind: string) {
    return kind === "corporate" ? "Kurumsal" : "Bireysel";
  }

  // ── Bayi Yap işlemi ─────────────────────────────────────────────────
  async function handlePromote() {
    if (!promoteTarget) return;
    const rate = parseFloat(commissionInput);
    if (isNaN(rate) || rate <= 0 || rate > 100) {
      setPromoteError("Komisyon oranı 0-100 arasında olmalıdır");
      return;
    }
    setPromoting(true);
    setPromoteError(null);
    try {
      await adminService.updateUserRole(promoteTarget.id, {
        role: "reseller",
        commissionRate: rate,
      });
      // Listeyi güncelle
      setUsers((prev) =>
        prev.map((u) =>
          u.id === promoteTarget.id ? { ...u, role: "reseller" } : u
        )
      );
      setPromoteTarget(null);
      setCommissionInput("15");
    } catch (err: unknown) {
      setPromoteError(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setPromoting(false);
    }
  }

  // ── Bayilikten düşür ────────────────────────────────────────────────
  async function handleDemote(userId: number) {
    if (!confirm("Bu bayiyi normal müşteriye düşürmek istediğinize emin misiniz?")) return;
    try {
      await adminService.updateUserRole(userId, { role: "user" });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: "customer" } : u))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "İşlem başarısız");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kullanıcılar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Toplam {total} kayıtlı müşteri
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ad, email veya müşteri no..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 sm:w-72"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Ara
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Temizle
            </button>
          )}
        </form>
      </div>

      {/* Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-2xl bg-white ring-1 ring-slate-100"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-100">
          <UsersRound className="inline-block h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            {search ? "Aramanıza uygun kullanıcı bulunamadı" : "Henüz kayıtlı kullanıcı yok"}
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
                    Kullanıcı
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    E-posta
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    Müşteri No
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    Tip
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    Rol
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    Durum
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-indigo-50/40"
                  >
                    <td
                      className="px-5 py-3.5 cursor-pointer"
                      onClick={() => router.push(`/admin/kullanicilar/${u.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${
                          u.role === "reseller"
                            ? "bg-gradient-to-br from-purple-500 to-fuchsia-500"
                            : "bg-gradient-to-br from-indigo-500 to-violet-500"
                        }`}>
                          {(u.firstName?.[0] ?? "").toUpperCase()}
                          {(u.lastName?.[0] ?? "").toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3.5 text-slate-600 cursor-pointer"
                      onClick={() => router.push(`/admin/kullanicilar/${u.id}`)}
                    >
                      {u.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                        {u.customerId}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.kind === "corporate"
                            ? "bg-violet-50 text-violet-600"
                            : "bg-sky-50 text-sky-600"
                        }`}
                      >
                        {kindLabel(u.kind)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role === "reseller" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-600">
                          <Crown className="h-3 w-3" /> Bayi
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Müşteri</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                          <XCircle className="h-3 w-3" /> Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role === "reseller" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDemote(u.id); }}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                        >
                          Bayiliği Kaldır
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPromoteTarget(u); setPromoteError(null); }}
                          className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Bayi Yap
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                      u.role === "reseller"
                        ? "bg-gradient-to-br from-purple-500 to-fuchsia-500"
                        : "bg-gradient-to-br from-indigo-500 to-violet-500"
                    }`}
                    onClick={() => router.push(`/admin/kullanicilar/${u.id}`)}
                  >
                    {(u.firstName?.[0] ?? "").toUpperCase()}
                    {(u.lastName?.[0] ?? "").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 truncate">
                      {u.firstName} {u.lastName}
                      {u.role === "reseller" && (
                        <Crown className="ml-1.5 inline h-3.5 w-3.5 text-purple-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3 w-3" /> {u.email}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {u.isActive ? (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                        Aktif
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
                        Pasif
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {u.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {u.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" /> {u.customerId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(u.createdAt)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      u.kind === "corporate"
                        ? "bg-violet-50 text-violet-600"
                        : "bg-sky-50 text-sky-600"
                    }`}
                  >
                    {kindLabel(u.kind)}
                  </span>
                </div>
                {/* Mobile action button */}
                <div className="mt-3 flex justify-end">
                  {u.role === "reseller" ? (
                    <button
                      onClick={() => handleDemote(u.id)}
                      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      Bayiliği Kaldır
                    </button>
                  ) : (
                    <button
                      onClick={() => { setPromoteTarget(u); setPromoteError(null); }}
                      className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      Bayi Yap
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-3 ring-1 ring-slate-100 shadow-sm">
              <span className="text-sm text-slate-500">
                Sayfa {page} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Bayi Yap Modal ──────────────────────────────────────────────── */}
      {promoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
            {/* Kapatma */}
            <button
              onClick={() => setPromoteTarget(null)}
              disabled={promoting}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* İkon */}
            <div className="mb-5 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50">
                <Crown className="h-7 w-7 text-purple-500" />
              </div>
            </div>

            <h3 className="mb-2 text-center text-lg font-bold text-slate-900">
              Bayi Olarak Ata
            </h3>
            <p className="mb-6 text-center text-sm text-slate-500">
              <strong className="text-slate-800">
                {promoteTarget.firstName} {promoteTarget.lastName}
              </strong>{" "}
              ({promoteTarget.email}) kullanıcısını bayi olarak atayın.
            </p>

            {/* Komisyon oranı input */}
            <div className="mb-6">
              <label
                htmlFor="commission-rate"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Komisyon Oranı (%)
              </label>
              <input
                id="commission-rate"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={commissionInput}
                onChange={(e) => setCommissionInput(e.target.value)}
                placeholder="Örn: 15"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                disabled={promoting}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Bu oran, bayi üzerinden gelen her siparişten bayinin kazanacağı yüzdeyi belirler.
              </p>
            </div>

            {/* Hata mesajı */}
            {promoteError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                {promoteError}
              </div>
            )}

            {/* Butonlar */}
            <div className="flex gap-3">
              <button
                onClick={() => setPromoteTarget(null)}
                disabled={promoting}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                İptal
              </button>
              <button
                onClick={handlePromote}
                disabled={promoting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {promoting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Bayi Olarak Ata
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
