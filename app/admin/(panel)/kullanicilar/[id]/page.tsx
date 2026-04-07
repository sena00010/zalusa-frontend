"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  Package,
  Clock,
  CreditCard,
  FileText,
  Truck,
  PackageCheck,
  Ban,
  ShoppingCart,
} from "lucide-react";
import { adminService, type UserShipment } from "@/lib/services/adminService";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const stepLabels: Record<number, string> = {
  0: "Gönderi Tipi",
  1: "Paket Bilgileri",
  2: "Kargo Seçimi",
  3: "Adres Bilgileri",
  4: "Proforma",
  5: "Onay",
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  const map: Record<string, string> = {
    draft: "bg-amber-50 text-amber-600 ring-amber-200",
    pending_payment: "bg-orange-50 text-orange-600 ring-orange-200",
    paid: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    shipped: "bg-blue-50 text-blue-600 ring-blue-200",
    delivered: "bg-green-50 text-green-700 ring-green-200",
    cancelled: "bg-red-50 text-red-500 ring-red-200",
  };
  const cls = map[status] || "bg-slate-50 text-slate-600 ring-slate-200";

  const icons: Record<string, React.ReactNode> = {
    draft: <FileText className="h-3 w-3" />,
    pending_payment: <CreditCard className="h-3 w-3" />,
    paid: <CheckCircle2 className="h-3 w-3" />,
    shipped: <Truck className="h-3 w-3" />,
    delivered: <PackageCheck className="h-3 w-3" />,
    cancelled: <Ban className="h-3 w-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}
    >
      {icons[status]} {label}
    </span>
  );
}

interface UserInfo {
  id: number;
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  kind: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.id);

  const [user, setUser] = React.useState<UserInfo | null>(null);
  const [shipments, setShipments] = React.useState<UserShipment[]>([]);
  const [summary, setSummary] = React.useState("");
  const [draftCount, setDraftCount] = React.useState(0);
  const [pendingCount, setPendingCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await adminService.getUserShipments(userId);
        setUser(data.user);
        setShipments(data.shipments ?? []);
        setSummary(data.summary ?? "");
        setDraftCount(data.draftCount ?? 0);
        setPendingCount(data.pendingCount ?? 0);
      } catch (err: any) {
        setError(err.message || "Kullanıcı bilgileri yüklenemedi");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-48 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/admin/kullanicilar")}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kullanıcılara Dön
        </button>
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-100">
          <XCircle className="inline-block h-10 w-10 text-red-300" />
          <p className="mt-3 text-sm text-slate-500">{error || "Kullanıcı bulunamadı"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/kullanicilar")}
        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kullanıcılara Dön
      </button>

      {/* User Info Card */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white shadow-lg shadow-indigo-200">
              {(user.firstName?.[0] ?? "").toUpperCase()}
              {(user.lastName?.[0] ?? "").toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {user.firstName} {user.lastName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500 ring-1 ring-red-200">
                <XCircle className="h-3 w-3" /> Pasif
              </span>
            )}
            {user.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 ring-1 ring-blue-200">
                <CheckCircle2 className="h-3 w-3" /> Doğrulanmış
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 ring-1 ring-amber-200">
                <Clock className="h-3 w-3" /> Doğrulanmamış
              </span>
            )}
          </div>
        </div>

        {/* Detail grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Hash className="h-3 w-3" /> Müşteri No
            </div>
            <div className="mt-1 font-mono text-sm font-semibold text-slate-800">
              {user.customerId}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              {user.kind === "corporate" ? (
                <Building2 className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}{" "}
              Hesap Tipi
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              {user.kind === "corporate" ? "Kurumsal" : "Bireysel"}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Calendar className="h-3 w-3" /> Kayıt Tarihi
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              {formatShortDate(user.createdAt)}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Package className="h-3 w-3" /> Gönderiler
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              {shipments.length} adet
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {(draftCount > 0 || pendingCount > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {draftCount > 0 && (
            <div className="flex items-center gap-3 rounded-2xl bg-amber-50 px-5 py-4 ring-1 ring-amber-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700">{draftCount}</div>
                <div className="text-xs font-medium text-amber-600">Sepetteki Taslak</div>
              </div>
            </div>
          )}
          {pendingCount > 0 && (
            <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-5 py-4 ring-1 ring-orange-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-700">{pendingCount}</div>
                <div className="text-xs font-medium text-orange-600">Ödeme Bekleyen</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shipments Section */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Sepetteki / Bekleyen Gönderiler
        </h3>

        {shipments.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-100">
            <Package className="inline-block h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              Bu kullanıcıya ait gönderi bulunamadı
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
                      Takip Kodu
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                      Durum
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                      Mevcut Adım
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                      Gönderi Tipi
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                      Rota
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                      Kargo
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                      Fiyat (₺)
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-600">
                      Oluşturma Tarihi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {shipments.map((s) => (
                    <tr
                      key={s.id}
                      className={`transition-colors ${
                        s.status === "draft" || s.status === "pending_payment"
                          ? "bg-amber-50/20"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                          {s.trackingCode || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={s.status} label={s.statusLabel} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-slate-600">
                          {stepLabels[s.currentStep] ?? `Adım ${s.currentStep}`}
                        </span>
                        <span className="ml-1.5 text-xs text-slate-400">
                          ({s.currentStep}/5)
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {s.shipmentType}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {s.senderCountry} → {s.receiverCountry}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {s.carrierName || "—"}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {s.carrierPriceTry
                          ? `₺${s.carrierPriceTry.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {formatDate(s.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {shipments.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm ${
                    s.status === "draft" || s.status === "pending_payment"
                      ? "ring-amber-200"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {s.trackingCode || "—"}
                    </span>
                    <StatusBadge status={s.status} label={s.statusLabel} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Adım:</span>
                      <span className="ml-1 font-medium text-slate-700">
                        {stepLabels[s.currentStep] ?? `Adım ${s.currentStep}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Tip:</span>
                      <span className="ml-1 font-medium text-slate-700">
                        {s.shipmentType}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Rota:</span>
                      <span className="ml-1 font-medium text-slate-700">
                        {s.senderCountry} → {s.receiverCountry}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Kargo:</span>
                      <span className="ml-1 font-medium text-slate-700">
                        {s.carrierName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Fiyat:</span>
                      <span className="ml-1 font-semibold text-slate-800">
                        {s.carrierPriceTry
                          ? `₺${s.carrierPriceTry.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}`
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Tarih:</span>
                      <span className="ml-1 font-medium text-slate-700">
                        {formatShortDate(s.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
