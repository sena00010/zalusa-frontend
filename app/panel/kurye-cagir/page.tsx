"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Calendar, ChevronDown, Loader2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courierService, CourierPickup } from "@/lib/services/courierService";

// Adres ve gönderi listesi için basit tipler
interface AddressOption {
  id: number;
  label: string;
  address: string;
  city: string;
  phone: string;
}

interface ShipmentOption {
  id: number;
  trackingCode: string;
  receiverCountry: string;
  carrierName: string;
  status: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("zalusa.token") || "";
}

// Status → renk eşleştirmesi
function statusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-600";
    case "confirmed":
      return "bg-blue-50 text-blue-600";
    case "picked_up":
      return "bg-indigo-50 text-indigo-600";
    case "completed":
      return "bg-green-50 text-green-600";
    case "cancelled":
      return "bg-red-50 text-[#EF4444]";
    default:
      return "bg-slate-50 text-slate-600";
  }
}

export default function KuryeCagirPage() {
  // ── State ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pickups, setPickups] = useState<CourierPickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // İptal onay modalı
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Modal state
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [shipments, setShipments] = useState<ShipmentOption[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    addressId: "",
    pickupDate: new Date().toISOString().split("T")[0], // bugün
    contactPerson: "",
    contactPhone: "+90 ",
    shipmentId: "",
    note: "",
  });

  // ── Kurye listesini çek ──
  const fetchPickups = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await courierService.list({ search: searchQuery || undefined });
      setPickups(data.pickups);
    } catch (err: any) {
      setError(err.message || "Kurye kayıtları yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  // ── Arama debounce ──
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  function handleSearch(value: string) {
    setSearchQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => fetchPickups(), 400));
  }

  // ── Modal açılınca adres + gönderi listesini çek ──
  async function openModal() {
    setIsModalOpen(true);
    setFormError("");
    setForm({
      addressId: "",
      pickupDate: new Date().toISOString().split("T")[0],
      contactPerson: "",
      contactPhone: "+90 ",
      shipmentId: "",
      note: "",
    });

    try {
      // Adresleri çek (sender adresleri — kurye kullanıcının adresine geliyor)
      const addrRes = await fetch(`${API}/api/addresses?type=sender`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const addrData = await addrRes.json();
      setAddresses(addrData.addresses || []);

      // Gönderileri çek (draft hariç — kurye sadece onaylanmış gönderiler için çağrılır)
      const shipRes = await fetch(`${API}/api/shipments?status=pending_payment&limit=50`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const shipData = await shipRes.json();
      setShipments(shipData.shipments || []);
    } catch {
      setFormError("Veriler yüklenirken hata oluştu");
    }
  }

  // ── Kayıt oluştur ──
  async function handleCreate() {
    setFormError("");

    if (!form.addressId) { setFormError("Teslim adresi seçiniz"); return; }
    if (!form.pickupDate) { setFormError("Toplama tarihi seçiniz"); return; }
    if (!form.contactPerson.trim()) { setFormError("Toplama yapacak kişi giriniz"); return; }
    if (!form.contactPhone.trim() || form.contactPhone.trim() === "+90") { setFormError("Telefon numarası giriniz"); return; }
    if (!form.shipmentId) { setFormError("Gönderi seçiniz"); return; }

    try {
      setFormLoading(true);
      await courierService.create({
        shipmentId: Number(form.shipmentId),
        addressId: Number(form.addressId),
        pickupDate: form.pickupDate,
        contactPerson: form.contactPerson.trim(),
        contactPhone: form.contactPhone.trim(),
        note: form.note.trim() || undefined,
      });

      setIsModalOpen(false);
      fetchPickups(); // Listeyi yenile
    } catch (err: any) {
      setFormError(err.message || "Kurye kaydı oluşturulamadı");
    } finally {
      setFormLoading(false);
    }
  }

  // ── İptal ──
  function handleCancel(pickupId: number) {
    setCancelTargetId(pickupId);
    setCancelError("");
    setCancelModalOpen(true);
  }

  async function confirmCancel() {
    if (!cancelTargetId) return;
    try {
      setCancelLoading(true);
      setCancelError("");
      await courierService.cancel(cancelTargetId);
      setCancelModalOpen(false);
      setCancelTargetId(null);
      fetchPickups();
    } catch (err: any) {
      setCancelError(err.message || "İptal işlemi başarısız");
    } finally {
      setCancelLoading(false);
    }
  }

  // ── Tarih formatlama (2026-03-08 → 08.03.2026) ──
  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  }

  function formatDateTime(dateStr: string) {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
        " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="13" x="6" y="8" rx="2"/><path d="M6 14H4a2 2 0 0 1-2-2V5.5a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 16 5.5V8"/><path d="M2 10h4"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/><line x1="12" x2="16" y1="21" y2="21"/></svg>
          </div>
          <h1 className="text-[20px] font-bold text-slate-800">Kurye Kaydı</h1>
        </div>
      </div>

      {/* Search Bar container */}
      <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="relative mb-6">
          <fieldset className="rounded-lg border border-slate-300 px-4 pb-2.5 pt-1 focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600 transition-all bg-white relative">
            <legend className="px-1 text-[11px] font-medium text-slate-400">Kurye Kaydı Arama</legend>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Kurye kodu veya kişi adı ile arayın..."
                className="w-full bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
          </fieldset>
        </div>

        <Button
          onClick={openModal}
          className="w-full rounded-2xl bg-[#007BFF] hover:bg-blue-600 text-white font-semibold py-[12px] text-[15px] shadow-sm gap-2"
        >
          <div className="flex items-center justify-center p-0.5 rounded-full border-[1.5px] border-white">
            <Plus className="h-3 w-3" strokeWidth={3} />
          </div>
          Yeni Kurye Kaydı Oluştur
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-100">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && pickups.length === 0 && (
        <div className="rounded-[16px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-slate-400 text-sm">
            {searchQuery ? "Aramanızla eşleşen kurye kaydı bulunamadı." : "Henüz kurye kaydınız bulunmamaktadır."}
          </div>
        </div>
      )}

      {/* Record List */}
      <div className="flex flex-col gap-4">
        {pickups.map((record) => (
          <div key={record.id} className="rounded-[16px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">

              <div className="text-[14px] text-slate-600 flex flex-col gap-4">
                <div>
                  <span className="font-semibold text-slate-800">Teslimat Kodu: </span>
                  <span className="text-[#007BFF] font-medium">{record.pickupCode}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Teslimat Adresi: </span>
                  {record.addressLabel} - {record.addressText}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Toplama Yapacak Kişi: </span>
                  {record.contactPerson}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Toplama Tarihi: </span>
                  {formatDate(record.pickupDate)}
                </div>
              </div>

              <div className="text-[14px] text-slate-600 flex flex-col gap-4 lg:col-span-1">
                <div>
                  <span className="font-semibold text-slate-800">Oluşturma Tarihi: </span>
                  {formatDateTime(record.createdAt)}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Kargo Firması: </span>
                  {record.carrierName}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Telefon Numarası: </span>
                  {record.contactPhone}
                </div>
                {record.trackingCode && (
                  <div>
                    <span className="font-semibold text-slate-800">Takip Kodu: </span>
                    <span className="text-[#007BFF] font-medium">{record.trackingCode}</span>
                  </div>
                )}
              </div>

              <div className="text-[14px] text-slate-600 flex flex-col items-start md:items-end justify-between h-full gap-3">
                <div className={`rounded-full px-4 py-2 text-[13px] font-bold ${statusColor(record.status)}`}>
                  {record.statusLabel}
                </div>
                {record.status !== "cancelled" && record.status !== "completed" && record.status !== "picked_up" && (
                  <button
                    onClick={() => handleCancel(record.id)}
                    className="text-[13px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                  >
                    İptal Et
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 pt-5">
              <Button className="w-full sm:w-auto bg-[#007BFF] hover:bg-blue-600 text-white font-semibold px-12 py-[12px] rounded-2xl shadow-sm">
                Gönderi Bilgisi
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Modal ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl rounded-[20px] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6">
              <h2 className="text-[22px] font-bold text-slate-800">Kurye Kaydı Oluştur</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-8 pb-8 pt-2">
              {/* Error */}
              {formError && (
                <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">

                {/* Teslim Adresi */}
                <div className="relative">
                  <select
                    value={form.addressId}
                    onChange={(e) => setForm((f) => ({ ...f, addressId: e.target.value }))}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3.5 text-[14px] text-slate-600 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 cursor-pointer h-[50px]"
                  >
                    <option value="" disabled>Teslim Adresi Seçiniz *</option>
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label} - {addr.address}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  {addresses.length === 0 && (
                    <div className="mt-1 text-[11px] text-amber-500">Kayıtlı gönderici adresiniz yok. Önce adres ekleyin.</div>
                  )}
                </div>

                {/* Teslim Tarihi */}
                <fieldset className="rounded-lg border border-slate-300 px-3 pb-1 pt-1.5 focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600 transition-all bg-white relative h-[50px] flex flex-col justify-center">
                  <legend className="px-1 text-[10px] font-medium text-slate-400 -mt-2 bg-white">Teslim Tarihi *</legend>
                  <div className="flex items-center gap-2 -mt-1">
                    <input
                      type="date"
                      value={form.pickupDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setForm((f) => ({ ...f, pickupDate: e.target.value }))}
                      className="w-full bg-transparent text-[14px] text-slate-700 font-medium outline-none"
                    />
                  </div>
                </fieldset>

                {/* Toplama Yapacak Kişi */}
                <div className="relative">
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                    placeholder="Toplama Yapacak Kişi *"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3.5 text-[14px] text-slate-600 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 h-[50px]"
                  />
                </div>

                {/* Phone */}
                <div className="relative flex h-[50px]">
                  <div className="flex shrink-0 items-center justify-center gap-1.5 rounded-l-lg border border-r-0 border-slate-300 bg-white pl-3 pr-2 py-3.5 cursor-pointer">
                    <div className="h-4 w-6 bg-red-600 flex items-center justify-center text-[10px] text-white font-bold rounded-[2px]">
                      TR
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                  <input
                    type="text"
                    value={form.contactPhone}
                    onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    className="w-full rounded-r-lg border border-slate-300 bg-white px-3 py-3.5 text-[14px] text-slate-700 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                  />
                </div>
              </div>

              {/* Gönderi Seçin */}
              <div className="relative mb-8">
                <select
                  value={form.shipmentId}
                  onChange={(e) => setForm((f) => ({ ...f, shipmentId: e.target.value }))}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3.5 text-[14px] text-slate-600 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 cursor-pointer h-[50px]"
                >
                  <option value="" disabled>Gönderi Seçin *</option>
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.trackingCode} — {s.carrierName} → {s.receiverCountry}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                {shipments.length === 0 && (
                  <div className="mt-1 text-[11px] text-amber-500">Kurye çağrılabilecek gönderi bulunamadı. Önce gönderi oluşturun.</div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[14px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Vazgeç
                </button>
                <Button
                  onClick={handleCreate}
                  disabled={formLoading}
                  className="rounded-full bg-[#EBF5FF] text-[#007BFF] hover:bg-[#D6EAFF] hover:text-[#0056b3] font-bold px-8 py-2.5 h-auto text-[14px] border-0 shadow-none transition-colors disabled:opacity-50"
                >
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Kayıt Oluştur
                </Button>
              </div>
            </div>
          </div>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[-1]" onClick={() => setIsModalOpen(false)} />
        </div>
      )}

      {/* ═══ İptal Onay Modalı ═══ */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[20px] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <h2 className="text-[17px] font-bold text-slate-800">Kurye Kaydınız İptal Edildi</h2>
              </div>
              <button
                onClick={() => { setCancelModalOpen(false); setCancelError(""); }}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              <p className="text-[14px] text-slate-600 leading-relaxed">
                Bu kurye kaydını iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>

              {cancelError && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {cancelError}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => { setCancelModalOpen(false); setCancelError(""); }}
                disabled={cancelLoading}
                className="text-[14px] font-semibold text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                Vazgeç
              </button>
              <Button
                onClick={confirmCancel}
                disabled={cancelLoading}
                className="rounded-full bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 h-auto text-[14px] border-0 shadow-none transition-colors disabled:opacity-50"
              >
                {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Evet, İptal Et
              </Button>
            </div>
          </div>
          <div className="fixed inset-0 z-[-1]" onClick={() => { setCancelModalOpen(false); setCancelError(""); }} />
        </div>
      )}
    </div>
  );
}