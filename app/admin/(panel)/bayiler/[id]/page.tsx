"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Wallet,
  TrendingUp,
  Users,
  Ticket,
  Package,
  CreditCard,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Edit3,
  Check,
  RefreshCcw,
  Mail,
  Phone,
  Calendar,
  Hash,
} from "lucide-react";
import { adminService } from "@/lib/services/adminService";
import { resellerService } from "@/lib/services/resellerService";

function formatCurrency(val: number): string {
  return val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "ZLS-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

type Tab = "genel" | "musteriler" | "kuponlar";

export default function ResellerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resellerId = Number(params.id);

  const [tab, setTab] = React.useState<Tab>("genel");
  const [detail, setDetail] = React.useState<Awaited<ReturnType<typeof adminService.getResellerDetail>> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Commission edit
  const [editingCommission, setEditingCommission] = React.useState(false);
  const [commissionInput, setCommissionInput] = React.useState("");

  // Customers
  type Customer = Awaited<ReturnType<typeof adminService.getResellerCustomers>>["customers"][number];
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = React.useState(false);
  const [customersLoaded, setCustomersLoaded] = React.useState(false);
  const [expandedCustomer, setExpandedCustomer] = React.useState<number | null>(null);
  type Shipment = Awaited<ReturnType<typeof adminService.getResellerCustomerShipments>>["shipments"][number];
  const [customerShipments, setCustomerShipments] = React.useState<Record<number, Shipment[]>>({});

  // Coupons
  type Coupon = Awaited<ReturnType<typeof adminService.getResellerCoupons>>["coupons"][number];
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = React.useState(false);
  const [couponsLoaded, setCouponsLoaded] = React.useState(false);
  const [showCouponModal, setShowCouponModal] = React.useState(false);
  const [creatingCoupon, setCreatingCoupon] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [couponForm, setCouponForm] = React.useState({ code: "", discountPct: "5", usageLimit: "", expiresAt: "" });

  // Link Customer
  const [showLinkCustomerModal, setShowLinkCustomerModal] = React.useState(false);
  const [linkingCustomer, setLinkingCustomer] = React.useState(false);
  const [linkCustomerEmail, setLinkCustomerEmail] = React.useState("");
  const [linkCustomerError, setLinkCustomerError] = React.useState<string | null>(null);

  const handleLinkCustomer = async () => {
    if (!linkCustomerEmail) { setLinkCustomerError("Lütfen e-posta adresini girin"); return; }
    setLinkingCustomer(true);
    setLinkCustomerError(null);
    try {
      await adminService.linkExistingCustomer(resellerId, linkCustomerEmail);
      setShowLinkCustomerModal(false);
      setLinkCustomerEmail("");
      setDetail((prev) => prev ? { ...prev, customerCount: prev.customerCount + 1 } : prev);
      setCustomersLoaded(false);
      loadCustomers();
    } catch (err: unknown) {
      setLinkCustomerError(err instanceof Error ? err.message : "Müşteri eklenemedi");
    } finally {
      setLinkingCustomer(false);
    }
  };

  // ── Load detail ─────────────────────────────────────────────────
  const loadDetail = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getResellerDetail(resellerId);
      setDetail(data);
      setCommissionInput(String(data.commissionRate));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bayi bilgileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [resellerId]);

  React.useEffect(() => { loadDetail(); }, [loadDetail]);

  // ── Load customers ──────────────────────────────────────────────
  const loadCustomers = React.useCallback(async () => {
    setCustomersLoading(true);
    try {
      const data = await adminService.getResellerCustomers(resellerId);
      setCustomers(data.customers ?? []);
    } catch { setCustomers([]); }
    finally { setCustomersLoading(false); setCustomersLoaded(true); }
  }, [resellerId]);

  // ── Load coupons ────────────────────────────────────────────────
  const loadCoupons = React.useCallback(async () => {
    setCouponsLoading(true);
    try {
      const data = await adminService.getResellerCoupons(resellerId);
      setCoupons(data.coupons ?? []);
    } catch { setCoupons([]); }
    finally { setCouponsLoading(false); setCouponsLoaded(true); }
  }, [resellerId]);

  // ── Tab change → lazy load (runs only once per tab) ─────────────
  React.useEffect(() => {
    if (tab === "musteriler" && !customersLoaded && !customersLoading) loadCustomers();
    if (tab === "kuponlar" && !couponsLoaded && !couponsLoading) loadCoupons();
  }, [tab, customersLoaded, customersLoading, couponsLoaded, couponsLoading, loadCustomers, loadCoupons]);

  // ── Toggle customer shipments ───────────────────────────────────
  const toggleCustomerShipments = async (custId: number) => {
    if (expandedCustomer === custId) { setExpandedCustomer(null); return; }
    setExpandedCustomer(custId);
    if (!customerShipments[custId]) {
      try {
        const data = await adminService.getResellerCustomerShipments(resellerId, custId);
        setCustomerShipments((prev) => ({ ...prev, [custId]: data.shipments ?? [] }));
      } catch { setCustomerShipments((prev) => ({ ...prev, [custId]: [] })); }
    }
  };

  // ── Save commission ─────────────────────────────────────────────
  const saveCommission = async () => {
    const rate = parseFloat(commissionInput);
    if (isNaN(rate) || rate <= 0 || rate > 100) return;
    try {
      await adminService.updateReseller(resellerId, { commissionRate: rate });
      setDetail((prev) => prev ? { ...prev, commissionRate: rate } : prev);
      setEditingCommission(false);
    } catch { /* ignore */ }
  };

  // ── Create coupon ───────────────────────────────────────────────
  const handleCreateCoupon = async () => {
    if (!couponForm.code || !couponForm.discountPct) { setCouponError("Kod ve indirim oranı zorunlu"); return; }
    setCreatingCoupon(true);
    setCouponError(null);
    try {
      await adminService.createCoupon(resellerId, {
        code: couponForm.code.toUpperCase(),
        discountPct: parseFloat(couponForm.discountPct),
      });
      setShowCouponModal(false);
      setCouponForm({ code: "", discountPct: "5", usageLimit: "", expiresAt: "" });
      setCouponsLoaded(false);
      loadCoupons();
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : "Kupon oluşturulamadı");
    } finally { setCreatingCoupon(false); }
  };

  // ── Toggle coupon status ─────────────────────────────────────────
  const handleToggleCouponStatus = async (couponId: number, currentActive: boolean) => {
    try {
      await adminService.updateCouponStatus(couponId, !currentActive);
      setCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, isActive: !currentActive } : c))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Durum güncellenemedi");
    }
  };

  // ── Delete coupon ───────────────────────────────────────────────
  const handleDeleteCoupon = async (couponId: number) => {
    if (!confirm("Bu kuponu silmek istediğinize emin misiniz?")) return;
    try {
      await adminService.deleteCoupon(couponId);
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Silinemedi"); }
  };

  // ── Payout ──────────────────────────────────────────────────────
  const handlePayout = async () => {
    if (!detail || detail.balance <= 0) return;
    if (!confirm(`${formatCurrency(detail.balance)} ₺ ödeme yapmak istediğinize emin misiniz?`)) return;
    try {
      await resellerService.adminPayout(resellerId);
      setDetail((prev) => prev ? { ...prev, balance: 0 } : prev);
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Ödeme başarısız"); }
  };

  // ── Loading / Error ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-48 animate-pulse rounded-2xl bg-white" />
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }
  if (error || !detail) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Geri
        </button>
        <div className="rounded-2xl bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-600">{error || "Bayi bulunamadı"}</p>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "genel", label: "Genel Bilgi", icon: Crown },
    { key: "musteriler", label: `Müşteriler (${detail.customerCount})`, icon: Users },
    { key: "kuponlar", label: `Kuponlar (${detail.couponCount})`, icon: Ticket },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/admin/bayiler")} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-lg font-bold text-white">
            {detail.firstName[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{detail.firstName} {detail.lastName}</h1>
            <p className="text-sm text-slate-500">{detail.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab: Genel Bilgi ═══ */}
      {tab === "genel" && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                  <Crown className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {editingCommission ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={commissionInput} onChange={(e) => setCommissionInput(e.target.value)} className="w-16 rounded border px-2 py-0.5 text-lg font-bold" step="0.01" />
                        <button onClick={saveCommission} className="rounded bg-purple-600 p-1 text-white"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setEditingCommission(false); setCommissionInput(String(detail.commissionRate)); }} className="rounded bg-slate-200 p-1 text-slate-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xl font-bold text-slate-900">%{detail.commissionRate}</span>
                        <button onClick={() => setEditingCommission(true)} className="rounded p-0.5 text-slate-400 hover:text-purple-600"><Edit3 className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">Komisyon</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50"><TrendingUp className="h-5 w-5 text-emerald-500" /></div>
                <div>
                  <div className="text-xl font-bold text-slate-900">{formatCurrency(detail.totalEarned)} ₺</div>
                  <div className="text-xs text-slate-500">Toplam Kazanç</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50"><Wallet className="h-5 w-5 text-amber-500" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${detail.balance > 0 ? "text-emerald-600" : "text-slate-900"}`}>{formatCurrency(detail.balance)} ₺</span>
                    {detail.balance > 0 && (
                      <button onClick={handlePayout} className="rounded-lg bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-emerald-700">
                        <CreditCard className="inline h-3 w-3 mr-0.5" />Öde
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">Bakiye</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50"><Users className="h-5 w-5 text-sky-500" /></div>
                <div>
                  <div className="text-xl font-bold text-slate-900">{detail.customerCount}</div>
                  <div className="text-xs text-slate-500">Müşteri</div>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100">
            <h3 className="mb-4 text-sm font-bold text-slate-900">Bayi Bilgileri</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-slate-400" /> <span className="text-slate-600">{detail.email}</span></div>
              {detail.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-slate-400" /> <span className="text-slate-600">{detail.phone}</span></div>}
              <div className="flex items-center gap-2 text-sm"><Hash className="h-4 w-4 text-slate-400" /> <span className="font-mono text-slate-600">{detail.customerId}</span></div>
              <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-slate-400" /> <span className="text-slate-600">{formatDate(detail.createdAt)}</span></div>
            </div>
          </div>

          {/* Transactions */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100">
            <h3 className="mb-4 text-sm font-bold text-slate-900">Son İşlemler</h3>
            {detail.transactions.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">Henüz işlem yok</p>
            ) : (
              <div className="space-y-2">
                {detail.transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                    <div>
                      <span className={`text-xs font-bold uppercase ${t.type === "earning" ? "text-emerald-600" : "text-orange-500"}`}>{t.type === "earning" ? "Kazanç" : "Ödeme"}</span>
                      <p className="text-sm text-slate-600">{t.description}</p>
                    </div>
                    <span className={`text-sm font-bold ${t.type === "earning" ? "text-emerald-600" : "text-orange-500"}`}>{t.type === "earning" ? "+" : "-"}{formatCurrency(t.amount)} ₺</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Tab: Müşteriler ═══ */}
      {tab === "musteriler" && (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Bayinin Müşterileri</h3>
            <div className="flex items-center gap-2">
              <button onClick={loadCustomers} className="text-xs text-slate-400 hover:text-slate-600"><RefreshCcw className="inline h-3.5 w-3.5 mr-1" />Yenile</button>
              <button onClick={() => { setShowLinkCustomerModal(true); setLinkCustomerError(null); setLinkCustomerEmail(""); }} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700">
                <Plus className="h-3.5 w-3.5" /> Müşteri Ekle
              </button>
            </div>
          </div>
          {customersLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : customers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Bu bayiye bağlı müşteri yok</p>
          ) : (
            <div className="space-y-2">
              {customers.map((cust) => (
                <div key={cust.id}>
                  <button
                    onClick={() => toggleCustomerShipments(cust.id)}
                    className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
                        {cust.firstName[0]?.toUpperCase()}{cust.lastName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{cust.firstName} {cust.lastName}</div>
                        <div className="text-xs text-slate-500">{cust.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-600">
                        <Package className="inline h-3 w-3 mr-0.5" />{cust.shipmentCount} gönderi
                      </span>
                      {expandedCustomer === cust.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </button>

                  {/* Expanded: shipments */}
                  {expandedCustomer === cust.id && (
                    <div className="ml-11 mt-1 space-y-1">
                      {!customerShipments[cust.id] ? (
                        <div className="py-2 text-center text-xs text-slate-400">Yükleniyor...</div>
                      ) : customerShipments[cust.id].length === 0 ? (
                        <div className="py-2 text-center text-xs text-slate-400">Gönderi yok</div>
                      ) : (
                        customerShipments[cust.id].map((s) => (
                          <div key={s.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100 text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`rounded px-1.5 py-0.5 font-semibold ${
                                s.status === "delivered" ? "bg-emerald-50 text-emerald-600" :
                                s.status === "shipped" ? "bg-blue-50 text-blue-600" :
                                s.status === "paid" ? "bg-indigo-50 text-indigo-600" :
                                "bg-slate-100 text-slate-500"
                              }`}>{s.statusLabel}</span>
                              <span className="text-slate-500">{s.carrierName} {s.serviceName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500">
                              <span>{s.senderCountry} → {s.receiverCountry}</span>
                              <span className="font-semibold text-slate-700">{formatCurrency(s.carrierPriceTry)} ₺</span>
                              <span>{formatDate(s.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: Kuponlar ═══ */}
      {tab === "kuponlar" && (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">İndirim Kuponları</h3>
            <div className="flex items-center gap-2">
              <button onClick={loadCoupons} className="text-xs text-slate-400 hover:text-slate-600"><RefreshCcw className="inline h-3.5 w-3.5 mr-1" />Yenile</button>
              <button onClick={() => { setShowCouponModal(true); setCouponError(null); setCouponForm({ code: generateCouponCode(), discountPct: "5", usageLimit: "", expiresAt: "" }); }} className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-700">
                <Plus className="h-3.5 w-3.5" /> Kupon Oluştur
              </button>
            </div>
          </div>

          {couponsLoading ? (
            <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : coupons.length === 0 ? (
            <div className="py-8 text-center">
              <Ticket className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">Henüz kupon tanımlanmamış</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-3 pb-2 text-left text-xs font-semibold uppercase text-slate-400">Kod</th>
                    <th className="px-3 pb-2 text-left text-xs font-semibold uppercase text-slate-400">İndirim</th>
                    <th className="px-3 pb-2 text-left text-xs font-semibold uppercase text-slate-400">Kullanım</th>
                    <th className="px-3 pb-2 text-left text-xs font-semibold uppercase text-slate-400">Geçerlilik</th>
                    <th className="px-3 pb-2 text-left text-xs font-semibold uppercase text-slate-400">Durum</th>
                    <th className="px-3 pb-2 text-left text-xs font-semibold uppercase text-slate-400">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((cp) => (
                    <tr key={cp.id} className="border-b border-slate-50">
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="rounded-md bg-purple-50 px-2 py-0.5 font-mono text-xs font-bold text-purple-700">{cp.code}</span>
                          {(cp as any).creatorType === "reseller" ? (
                            <span className="text-[10px] font-semibold text-purple-500">Bayi Kuponu — bayinin kârından</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-orange-500">Admin Kuponu — Zalusa kârından</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-700">%{cp.discountPct}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-semibold text-slate-600">
                          {(cp as any).usedCount ?? 0}
                          {(cp as any).usageLimit > 0 ? (
                            <span className="font-normal text-slate-400"> / {(cp as any).usageLimit}</span>
                          ) : (
                            <span className="font-normal text-slate-400"> / ∞</span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {(() => {
                          const ea = (cp as any).expiresAt;
                          if (!ea) return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Süresiz</span>;
                          const d = new Date(ea);
                          const expired = d < new Date();
                          return (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${expired ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                              {expired ? "Süresi Doldu — " : ""}{d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => handleToggleCouponStatus(cp.id, cp.isActive)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            cp.isActive ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            cp.isActive ? "translate-x-4" : "translate-x-0"
                          }`} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => handleDeleteCoupon(cp.id)} className="rounded-lg border border-red-200 p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Kupon Oluştur Modal ──────────────────────────────────────── */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <button onClick={() => setShowCouponModal(false)} disabled={creatingCoupon} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
            <div className="mb-5 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50"><Ticket className="h-7 w-7 text-purple-500" /></div>
            </div>
            <h3 className="mb-6 text-center text-lg font-bold text-slate-900">Yeni Kupon Oluştur</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Kupon Kodu *</label>
                <div className="flex gap-2">
                  <input type="text" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="Örn: ZLS-ABC123" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-mono uppercase outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100" disabled={creatingCoupon} />
                  <button type="button" onClick={() => setCouponForm({ ...couponForm, code: generateCouponCode() })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-purple-600" disabled={creatingCoupon} title="Yeni kod üret">
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">Otomatik oluşturuldu, isterseniz değiştirebilirsiniz</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">İndirim (%) *</label>
                <input type="number" step="0.01" min="0.01" max="100" value={couponForm.discountPct} onChange={(e) => setCouponForm({ ...couponForm, discountPct: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100" disabled={creatingCoupon} />
                <p className="mt-1 text-xs text-slate-400">Müşterilere uygulanacak indirim yüzdesi</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Kullanım Limiti</label>
                  <input type="number" min="1" placeholder="Sınırsız" value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100" disabled={creatingCoupon} />
                  <p className="mt-1 text-xs text-slate-400">Boş bırakırsanız sınırsız</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Son Kullanma Tarihi</label>
                  <input type="datetime-local" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100" disabled={creatingCoupon} />
                  <p className="mt-1 text-xs text-slate-400">Boş = süresiz</p>
                </div>
              </div>
            </div>
            {couponError && <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-600">{couponError}</div>}
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowCouponModal(false)} disabled={creatingCoupon} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">İptal</button>
              <button onClick={handleCreateCoupon} disabled={creatingCoupon} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-purple-700 disabled:opacity-60">
                {creatingCoupon ? "Oluşturuluyor..." : <><Ticket className="h-4 w-4" /> Kupon Oluştur</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Müşteri Ekle (Link Existing) Modal ────────────────────────────── */}
      {showLinkCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <button onClick={() => setShowLinkCustomerModal(false)} disabled={linkingCustomer} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
            <div className="mb-5 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50"><Users className="h-7 w-7 text-indigo-500" /></div>
            </div>
            <h3 className="mb-6 text-center text-lg font-bold text-slate-900">Mevcut Müşteriyi Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Müşteri E-posta Adresi *</label>
                <input type="email" value={linkCustomerEmail} onChange={(e) => setLinkCustomerEmail(e.target.value)} placeholder="Örn: musteri@gmail.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" disabled={linkingCustomer} />
                <p className="mt-1 text-xs text-slate-400">Halihazırda sisteme kayıtlı olan bir kullanıcıyı bu bayiye atayabilirsiniz.</p>
              </div>
            </div>
            {linkCustomerError && <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-600">{linkCustomerError}</div>}
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowLinkCustomerModal(false)} disabled={linkingCustomer} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">İptal</button>
              <button onClick={handleLinkCustomer} disabled={linkingCustomer} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60">
                {linkingCustomer ? "Ekleniyor..." : "Müşteriyi Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
