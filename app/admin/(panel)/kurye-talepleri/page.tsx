"use client";

import React from "react";
import { Truck, Clock, CheckCircle2, XCircle, ChevronDown, Phone, User, Hash } from "lucide-react";
import { adminService, type CourierPickup } from "@/lib/services/adminService";

const statusLabels: Record<string, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  picked_up: "Alındı",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  picked_up: "bg-indigo-50 text-indigo-600",
  completed: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-red-50 text-red-500",
};

export default function CourierPickupsPage() {
  const [pickups, setPickups] = React.useState<CourierPickup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState<number | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  async function load() {
    try {
      const data = await adminService.listCourierPickups();
      setPickups(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    setErrorMsg(null);
    try {
      await adminService.updateCourierStatus(id, { status });
      await load();
    } catch (err: any) {
      setErrorMsg(err.message || "Durum güncellenemedi.");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Kurye Talepleri</h1>
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kurye Talepleri</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tüm kurye talepleri — durumlarını buradan güncelleyebilirsiniz
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto shrink-0 hover:opacity-70 text-red-400">✕</button>
        </div>
      )}

      {pickups.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-100">
          <Truck className="inline-block h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">Henüz kurye talebi yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pickups.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                    <Truck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {p.pickupCode}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(p.pickupDate).toLocaleDateString("tr-TR")} • {p.carrierId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusColors[p.status] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {statusLabels[p.status] || p.status}
                  </span>

                  <div className="relative">
                    <select
                      disabled={updating === p.id}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) updateStatus(p.id, e.target.value);
                      }}
                      className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-xs font-medium text-slate-600 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 disabled:opacity-50"
                    >
                      <option value="">Durum Değiştir</option>
                      {Object.entries(statusLabels)
                        .filter(([k]) => k !== p.status)
                        .map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Detail row */}
              <div className="mt-3 flex flex-wrap gap-4 rounded-lg bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> {p.contactPerson}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {p.contactPhone}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" /> {p.trackingCode}
                </span>
                <span className="text-slate-400">
                  {p.userEmail}
                </span>
              </div>

              {p.note && (
                <div className="mt-2 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
                  📝 {p.note}
                </div>
              )}

              {p.cancelReason && (
                <div className="mt-2 rounded-lg bg-red-50 px-4 py-2 text-xs text-red-600">
                  ❌ İptal Sebebi: {p.cancelReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
