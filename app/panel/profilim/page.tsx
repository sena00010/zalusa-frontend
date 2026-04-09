"use client";

import React from "react";
import { Building2, FileText, Save, User, MapPin, MapPinned, Box, Plus, Trash2, Loader2, X, Lock, KeyRound, Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiProfile, profileService } from "@/lib/services/profileService";
import { addressService, ApiAddress, ApiMeasurement, measurementService } from "@/lib/services/shipmentService";

function AddressCard({ addr: a, onDelete, deleting }: { addr: ApiAddress; onDelete: () => void; deleting: boolean }) {
  return (
    <div className="group relative flex flex-col rounded-[16px] p-5 text-left border border-slate-200 bg-white hover:shadow-md transition-all">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="text-[14px] font-bold text-slate-900 pr-2">{a.label}</div>
        <button onClick={onDelete} disabled={deleting} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50" title="Sil">
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
      <div className="space-y-2.5 text-[13px] font-medium text-slate-600">
        <div className="flex items-start gap-2.5"><User className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" /><div><span className="font-bold text-slate-800">{a.name}</span>{a.company && <span className="block text-[12px] mt-0.5 text-slate-500">{a.company}</span>}</div></div>
        {a.phone && <div className="flex items-start gap-2.5"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" /><span>{a.phone}</span></div>}
        <div className="flex items-start gap-2.5"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" /><span className="leading-snug">{a.address}</span></div>
        <div className="flex items-start gap-2.5"><Building2 className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" /><span>{[a.postalCode, a.city, a.stateProvince, a.countryCode].filter(Boolean).join(" / ")}</span></div>
      </div>
      {a.isDefault && <div className="mt-4 pt-3 border-t border-slate-100"><span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">Varsayılan Adres</span></div>}
    </div>
  );
}

const TABS = [
  { id: "hesap", label: "Hesap Bilgileri" },
  { id: "fatura", label: "Fatura Bilgileri" },
  { id: "adres", label: "Kayıtlı Adreslerim" },
  { id: "olcu", label: "Kayıtlı Ölçülerim" },
  { id: "sifre", label: "Şifre İşlemleri" },
] as const;

export default function ProfilPage() {
  const router = useRouter();

  // Profile from backend
  const [profile, setProfile] = React.useState<ApiProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  const [message, setMessage] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("hesap");

  // Hesap form fields
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Fatura form fields
  const [tc, setTc] = React.useState("");
  const [taxNo, setTaxNo] = React.useState("");
  const [taxOffice, setTaxOffice] = React.useState("");
  const [invoiceAddress, setInvoiceAddress] = React.useState("");
  const [savingInvoice, setSavingInvoice] = React.useState(false);

  // Backend-driven state
  const [senderAddresses, setSenderAddresses] = React.useState<ApiAddress[]>([]);
  const [receiverAddresses, setReceiverAddresses] = React.useState<ApiAddress[]>([]);
  const [measurements, setMeasurements] = React.useState<ApiMeasurement[]>([]);
  const [loadingAddresses, setLoadingAddresses] = React.useState(false);
  const [loadingMeasurements, setLoadingMeasurements] = React.useState(false);

  const [showNewMeasForm, setShowNewMeasForm] = React.useState(false);
  const [newMeas, setNewMeas] = React.useState({ label: "", widthCm: "", lengthCm: "", heightCm: "", weightKg: "" });
  const [savingMeas, setSavingMeas] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [deletingAddrId, setDeletingAddrId] = React.useState<number | null>(null);

  const [addressFilter, setAddressFilter] = React.useState<"all" | "sender" | "receiver">("all");

  // Şifre değiştirme
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [showNewPw, setShowNewPw] = React.useState(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [passwordMessage, setPasswordMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Şifremi unuttum modal
  const [showForgotModal, setShowForgotModal] = React.useState(false);
  const [forgotStep, setForgotStep] = React.useState<1 | 2 | 3>(1); // 1: email → 2: kod → 3: yeni şifre
  const [forgotLoading, setForgotLoading] = React.useState(false);
  const [forgotError, setForgotError] = React.useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = React.useState<string | null>(null);
  const [forgotCode, setForgotCode] = React.useState(["" ,"", "", "", "", ""]);
  const [forgotNewPw, setForgotNewPw] = React.useState("");
  const [forgotConfirmPw, setForgotConfirmPw] = React.useState("");
  const [showForgotNewPw, setShowForgotNewPw] = React.useState(false);
  const [showForgotConfirmPw, setShowForgotConfirmPw] = React.useState(false);
  const codeInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Countries for address forms
  const [apiCountries, setApiCountries] = React.useState<{ value: string; label: React.ReactNode; searchableText: string }[]>([]);

  // New address forms
  const EMPTY_ADDR = { label: "", name: "", company: "", phone: "", countryCode: "", stateProvince: "", city: "", postalCode: "", address: "" };
  const [showNewSenderForm, setShowNewSenderForm] = React.useState(false);
  const [newSenderAddr, setNewSenderAddr] = React.useState(EMPTY_ADDR);
  const [savingSender, setSavingSender] = React.useState(false);
  const [showNewReceiverForm, setShowNewReceiverForm] = React.useState(false);
  const [newReceiverAddr, setNewReceiverAddr] = React.useState(EMPTY_ADDR);
  const [savingReceiver, setSavingReceiver] = React.useState(false);

  // ── Fetch profile on mount ──────────────────────────────────────────────
  React.useEffect(() => {
    const token = localStorage.getItem("zalusa.token");
    if (!token) {
      router.replace("/");
      return;
    }

    (async () => {
      try {
        const p = await profileService.get();
        setProfile(p);
        setFirstName(p.firstName);
        setLastName(p.lastName);
        setPhone(p.phone);
        setTc(p.tc ?? "");
        setTaxNo(p.taxNo ?? "");
        setTaxOffice(p.taxOffice ?? "");
        setInvoiceAddress(p.address ?? "");
      } catch (err) {
        console.error("Profil yüklenemedi:", err);
        setMessage("Profil bilgileri yüklenirken hata oluştu.");
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [router]);

  // ── Fetch addresses ─────────────────────────────────────────────────────
  const fetchAddresses = React.useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const [senderRes, receiverRes] = await Promise.all([
        addressService.list("sender"),
        addressService.list("receiver"),
      ]);
      setSenderAddresses(senderRes.addresses);
      setReceiverAddresses(receiverRes.addresses);
    } catch (err) {
      console.error("Adresler yüklenemedi:", err);
      setMessage("Adresler yüklenirken hata oluştu.");
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  // ── Fetch countries ──────────────────────────────────────────────────────
  React.useEffect(() => {
    const trNames = new Intl.DisplayNames(["tr"], { type: "region" });
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${API_BASE}/api/countries`)
      .then(res => res.json())
      .then((data: { isoCode: string; countryName: string }[]) => {
        if (!Array.isArray(data)) return;
        const mapped = data.map((c) => {
          const code = c.isoCode.toUpperCase();
          let trName = c.countryName;
          try { trName = trNames.of(code) || c.countryName; } catch {}
          const flagUrl = `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
          return {
            value: code,
            searchableText: `${trName} ${code}`,
            label: (
              <div className="flex items-center gap-2">
                <div className="shrink-0 overflow-hidden ring-1 ring-border shadow-sm h-5 w-7 relative flex items-center justify-center bg-muted/10 rounded-sm">
                  <img src={flagUrl} alt={code} className="w-full h-full object-cover" />
                </div>
                <span>{trName}</span>
              </div>
            ),
          };
        });
        setApiCountries(mapped);
      }).catch(console.error);
  }, []);

  // ── Fetch measurements ──────────────────────────────────────────────────
  const fetchMeasurements = React.useCallback(async () => {
    setLoadingMeasurements(true);
    try {
      const res = await measurementService.list();
      setMeasurements(res.measurements);
    } catch (err) {
      console.error("Ölçüler yüklenemedi:", err);
      setMessage("Ölçüler yüklenirken hata oluştu.");
    } finally {
      setLoadingMeasurements(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === "adres") fetchAddresses();
    if (activeTab === "olcu") fetchMeasurements();
  }, [activeTab, fetchAddresses, fetchMeasurements]);

  // ── Save hesap bilgileri ────────────────────────────────────────────────
  async function onSaveAccount() {
    setSavingProfile(true);
    setMessage(null);
    try {
      await profileService.update({ firstName, lastName, phone });
      setProfile((prev) => prev ? { ...prev, firstName, lastName, phone } : prev);
      // Keep localStorage in sync for other components that might read it
      localStorage.setItem("zalusa.fullName", `${firstName} ${lastName}`.trim());
      localStorage.setItem("zalusa.phone", phone);
      setMessage("Hesap bilgileri kaydedildi.");
    } catch (err: any) {
      setMessage(err.message || "Hesap bilgileri güncellenemedi.");
    } finally {
      setSavingProfile(false);
    }
  }

  // ── Save fatura bilgileri ───────────────────────────────────────────────
  async function onSaveInvoice() {
    setSavingInvoice(true);
    setMessage(null);
    try {
      await profileService.update({
        tc,
        taxNo,
        taxOffice,
        address: invoiceAddress,
      });
      setProfile((prev) =>
        prev ? { ...prev, tc, taxNo, taxOffice, address: invoiceAddress } : prev
      );
      setMessage("Fatura bilgileri kaydedildi.");
    } catch (err: any) {
      setMessage(err.message || "Fatura bilgileri güncellenemedi.");
    } finally {
      setSavingInvoice(false);
    }
  }

  // ── Measurement handlers ────────────────────────────────────────────────
  async function handleAddMeasurement() {
    if (!newMeas.label || !newMeas.widthCm || !newMeas.lengthCm || !newMeas.heightCm || !newMeas.weightKg) {
      setMessage("Lütfen ölçü için tüm alanları doldurun.");
      return;
    }
    setSavingMeas(true);
    setMessage(null);
    try {
      await measurementService.create({
        label: newMeas.label,
        widthCm: parseFloat(newMeas.widthCm),
        lengthCm: parseFloat(newMeas.lengthCm),
        heightCm: parseFloat(newMeas.heightCm),
        weightKg: parseFloat(newMeas.weightKg),
      });
      setNewMeas({ label: "", widthCm: "", lengthCm: "", heightCm: "", weightKg: "" });
      setShowNewMeasForm(false);
      setMessage("Yeni ölçü eklendi.");
      await fetchMeasurements();
    } catch (err: any) {
      setMessage(err.message || "Ölçü kaydedilemedi.");
    } finally {
      setSavingMeas(false);
    }
  }

  async function handleRemoveMeasurement(id: number) {
    setDeletingId(id);
    setMessage(null);
    try {
      await measurementService.delete(id);
      setMeasurements((prev) => prev.filter((x) => x.id !== id));
      setMessage("Kayıtlı ölçü silindi.");
    } catch (err: any) {
      setMessage(err.message || "Ölçü silinemedi.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRemoveAddress(id: number) {
    setDeletingAddrId(id);
    setMessage(null);
    try {
      await addressService.delete(id);
      setSenderAddresses((prev) => prev.filter((x) => x.id !== id));
      setReceiverAddresses((prev) => prev.filter((x) => x.id !== id));
      setMessage("Adres silindi.");
    } catch (err: any) {
      setMessage(err.message || "Adres silinemedi.");
    } finally {
      setDeletingAddrId(null);
    }
  }

  async function handleAddAddress(type: "sender" | "receiver") {
    const addr = type === "sender" ? newSenderAddr : newReceiverAddr;
    const setSaving = type === "sender" ? setSavingSender : setSavingReceiver;
    if (!addr.label || !addr.name || !addr.address || !addr.city || !addr.countryCode) {
      setMessage("Lütfen zorunlu alanları (Başlık, Ad Soyad, Ülke, Şehir, Açık Adres) doldurun.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await addressService.create({
        type,
        label: addr.label,
        name: addr.name,
        company: addr.company,
        phone: addr.phone,
        address: addr.address,
        postalCode: addr.postalCode,
        city: addr.city,
        stateProvince: addr.stateProvince,
        countryCode: addr.countryCode,
      });
      if (type === "sender") { setNewSenderAddr(EMPTY_ADDR); setShowNewSenderForm(false); }
      else { setNewReceiverAddr(EMPTY_ADDR); setShowNewReceiverForm(false); }
      setMessage(`${type === "sender" ? "Gönderici" : "Alıcı"} adresi eklendi.`);
      await fetchAddresses();
    } catch (err: any) {
      setMessage(err.message || "Adres kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  // ── Şifre değiştir ─────────────────────────────────────────────────────
  async function onChangePassword() {
    setPasswordMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "Lütfen tüm alanları doldurun." }); return;
    }
    if (newPassword.length < 8 || newPassword.length > 15) {
      setPasswordMessage({ type: "error", text: "Yeni şifre 8-15 karakter arasında olmalıdır." }); return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordMessage({ type: "error", text: "Yeni şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir." }); return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Yeni şifreler eşleşmiyor." }); return;
    }
    setSavingPassword(true);
    try {
      await profileService.changePassword({ currentPassword, newPassword });
      setPasswordMessage({ type: "success", text: "Şifreniz başarıyla güncellendi." });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err.message || "Şifre güncellenemedi." });
    } finally {
      setSavingPassword(false);
    }
  }

  // ── Şifremi unuttum akışı ──────────────────────────────────────────────
  function openForgotModal() {
    setShowForgotModal(true);
    setForgotStep(1);
    setForgotError(null);
    setForgotSuccess(null);
    setForgotCode(["", "", "", "", "", ""]);
    setForgotNewPw("");
    setForgotConfirmPw("");
  }
  function closeForgotModal() {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotError(null);
    setForgotSuccess(null);
  }

  async function handleForgotSendCode() {
    if (!profile?.email) return;
    setForgotLoading(true); setForgotError(null);
    try {
      await profileService.forgotPassword(profile.email);
      setForgotStep(2);
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setForgotError(err.message || "Kod gönderilemedi.");
    } finally {
      setForgotLoading(false);
    }
  }

  function handleCodeInput(index: number, value: string) {
    // Paste desteği: yapıştırılan 6 haneli kodu otomatik dağıt
    if (value.length > 1) {
      const digits = value.replace(/[^0-9]/g, "").slice(0, 6).split("");
      const newCode = [...forgotCode];
      digits.forEach((d, i) => { if (index + i < 6) newCode[index + i] = d; });
      setForgotCode(newCode);
      const nextIdx = Math.min(index + digits.length, 5);
      codeInputRefs.current[nextIdx]?.focus();
      return;
    }
    const digit = value.replace(/[^0-9]/g, "");
    const newCode = [...forgotCode];
    newCode[index] = digit;
    setForgotCode(newCode);
    if (digit && index < 5) codeInputRefs.current[index + 1]?.focus();
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !forgotCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  }

  async function handleForgotVerifyCode() {
    if (!profile?.email) return;
    const code = forgotCode.join("");
    if (code.length !== 6) { setForgotError("Lütfen 6 haneli kodu eksiksiz girin."); return; }
    setForgotLoading(true); setForgotError(null);
    try {
      await profileService.verifyResetCode(profile.email, code);
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err.message || "Kod doğrulanamadı.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleForgotResetPassword() {
    if (!profile?.email) return;
    if (!forgotNewPw || !forgotConfirmPw) { setForgotError("Lütfen tüm alanları doldurun."); return; }
    if (forgotNewPw.length < 8 || forgotNewPw.length > 15) { setForgotError("Şifre 8-15 karakter arasında olmalıdır."); return; }
    if (!/[A-Z]/.test(forgotNewPw) || !/[a-z]/.test(forgotNewPw) || !/[0-9]/.test(forgotNewPw)) {
      setForgotError("Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir."); return;
    }
    if (forgotNewPw !== forgotConfirmPw) { setForgotError("Şifreler eşleşmiyor."); return; }
    setForgotLoading(true); setForgotError(null);
    try {
      const code = forgotCode.join("");
      await profileService.resetPassword(profile.email, code, forgotNewPw);
      setForgotSuccess("Şifreniz başarıyla güncellendi!");
      setTimeout(() => closeForgotModal(), 2000);
    } catch (err: any) {
      setForgotError(err.message || "Şifre güncellenemedi.");
    } finally {
      setForgotLoading(false);
    }
  }

  const filteredAddresses =
    addressFilter === "sender"
      ? senderAddresses
      : addressFilter === "receiver"
        ? receiverAddresses
        : [...senderAddresses, ...receiverAddresses];

  // ── Loading state ───────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <span className="ml-3 text-sm text-muted">Profil yükleniyor…</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-sm text-muted">Profil bilgileri alınamadı.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
            Profil
          </h1>
          <p className="text-[13px] text-slate-500">
            Hesap ve fatura bilgilerini buradan yönet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <Badge className="bg-slate-100 text-slate-700 font-bold rounded-[8px] hover:bg-slate-200 transition-colors border-none py-1.5 px-3">
            Müşteri No: {profile.customerId}
          </Badge>
          {profile.isVerified ? (
            <Badge className="bg-[#ECFDF5] text-[#10B981] font-bold rounded-[8px] border-none py-1.5 px-3">
              Doğrulandı
            </Badge>
          ) : (
            <Badge className="bg-amber-50 text-amber-600 font-bold rounded-[8px] border-none py-1.5 px-3">
              Doğrulama bekliyor
            </Badge>
          )}
          {(profile.totalShipments ?? 0) > 0 && (
            <Badge className="bg-slate-50 text-slate-600 font-bold rounded-[8px] border-none py-1.5 px-3">
              {profile.totalShipments} gönderi
            </Badge>
          )}
        </div>
      </div>

      {message && (
        <div className="rounded-[12px] bg-blue-50 p-4 text-[13px] font-medium text-blue-700 border border-blue-100 shadow-sm">
          {message}
        </div>
      )}

      {/* TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-[10px] border transition-all ${
                isActive
                  ? "bg-white border-slate-200 text-slate-900 shadow-sm"
                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        {profile?.reseller && (
          <button
            onClick={() => setActiveTab("bayi")}
            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-[10px] border transition-all ${
              activeTab === "bayi"
                ? "bg-white border-slate-200 text-slate-900 shadow-sm"
                : "bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            Bayi Bilgileri
          </button>
        )}
      </div>

      {/* TAB CONTENT */}
      <div className="min-h-[400px]">
        {/* ═══ HESAP ═══ */}
        {activeTab === "hesap" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <h2 className="text-[18px] font-bold tracking-tight text-slate-900">Genel Bilgiler</h2>
                <button
                  onClick={onSaveAccount}
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-bold transition-all shadow-sm shrink-0 disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Değişiklikleri Kaydet
                </button>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <div className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                    <User className="h-4 w-4 text-slate-400" /> Ad
                  </div>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                </label>
                <label className="block">
                  <div className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                    <User className="h-4 w-4 text-slate-400" /> Soyad
                  </div>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                </label>
                <label className="block">
                  <div className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                    <User className="h-4 w-4 text-slate-400" /> Telefon
                  </div>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                </label>
                <label className="block">
                  <div className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                    <FileText className="h-4 w-4 text-slate-400" /> E-posta <span className="text-slate-400 ml-1 font-normal">(Değiştirilemez)</span>
                  </div>
                  <Input value={profile.email} disabled className="h-[44px] rounded-[12px] border-slate-200 bg-slate-50 font-medium text-[14px] text-slate-500" />
                </label>
                <label className="block md:col-span-2">
                  <div className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                    {profile.kind === "corporate" ? (
                      <Building2 className="h-4 w-4 text-slate-400" />
                    ) : (
                      <User className="h-4 w-4 text-slate-400" />
                    )}
                    Hesap tipi
                  </div>
                  <Input value={profile.kind === "corporate" ? "Kurumsal" : "Bireysel"} disabled className="h-[44px] rounded-[12px] border-slate-200 bg-slate-50 font-medium text-[14px] text-slate-500"  />
                </label>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={onSaveAccount}
                disabled={savingProfile}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-[14px] font-bold transition-all shadow-sm shrink-0 disabled:opacity-50"
              >
                {savingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Hesap Bilgilerini Kaydet
              </button>
            </div>
          </div>
        )}

        {/* ═══ BAYİ BİLGİLERİ ═══ */}
        {activeTab === "bayi" && profile?.reseller && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-4">
                <h2 className="text-[18px] font-bold tracking-tight text-slate-900">Bayi Bilgileri</h2>
                <p className="text-[13px] text-slate-500 font-medium">Size özel fiyatlandırma ve destek hizmeti sağlayan bayinizin iletişim bilgileri.</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <div className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-slate-400" /> Bayi Adı / Şirket Ünvanı
                  </div>
                  <Input value={profile.reseller.name} disabled className="h-[44px] rounded-[12px] border-slate-200 bg-slate-50 font-medium text-[14px] text-slate-600" />
                </label>
                <label className="block">
                  <div className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400" /> E-posta Adresi
                  </div>
                  <Input value={profile.reseller.email} disabled className="h-[44px] rounded-[12px] border-slate-200 bg-slate-50 font-medium text-[14px] text-slate-600" />
                </label>
                <label className="block">
                  <div className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                    <User className="h-4 w-4 text-slate-400" /> Telefon Numarası
                  </div>
                  <Input value={profile.reseller.phone || "Belirtilmemiş"} disabled className="h-[44px] rounded-[12px] border-slate-200 bg-slate-50 font-medium text-[14px] text-slate-600" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FATURA ═══ */}
        {activeTab === "fatura" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <h2 className="text-[18px] font-bold tracking-tight text-slate-900">Fatura Bilgileri</h2>
                <button
                  onClick={onSaveInvoice}
                  disabled={savingInvoice}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-bold transition-all shadow-sm shrink-0 disabled:opacity-50"
                >
                  {savingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Değişiklikleri Kaydet
                </button>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {profile.kind === "corporate" ? (
                  <>
                    <label className="block">
                      <div className="mb-2 text-[13px] font-semibold text-slate-700">Vergi No</div>
                      <Input value={taxNo} onChange={(e) => setTaxNo(e.target.value)} className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                    </label>
                    <label className="block">
                      <div className="mb-2 text-[13px] font-semibold text-slate-700">Vergi Dairesi</div>
                      <Input value={taxOffice} onChange={(e) => setTaxOffice(e.target.value)} className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                    </label>
                  </>
                ) : (
                  <label className="block md:col-span-2">
                    <div className="mb-2 text-[13px] font-semibold text-slate-700">TC Kimlik No</div>
                    <Input value={tc} onChange={(e) => setTc(e.target.value)} className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                  </label>
                )}
                <label className="block md:col-span-2">
                  <div className="mb-2 text-[13px] font-semibold text-slate-700">Fatura Adresi</div>
                  <Textarea value={invoiceAddress} onChange={(e) => setInvoiceAddress(e.target.value)} className="rounded-[12px] border-slate-200 bg-white font-medium text-[14px] min-h-[100px] resize-y" />
                </label>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={onSaveInvoice}
                disabled={savingInvoice}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-[14px] font-bold transition-all shadow-sm shrink-0 disabled:opacity-50"
              >
                {savingInvoice ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Fatura Bilgilerini Kaydet
              </button>
            </div>
          </div>
        )}

        {/* ═══ ADRESLER ═══ */}
        {activeTab === "adres" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* ── GÖNDERİCİ ADRESLERİ ── */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[17px] font-bold tracking-tight text-slate-900">Gönderici Adreslerim</h2>
                    <span className="text-[13px] text-slate-500">Gönderilerde kullandığınız adresler</span>
                  </div>
                </div>
                {!showNewSenderForm && (
                  <button
                    onClick={() => setShowNewSenderForm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[13px] font-bold hover:bg-slate-100 transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Yeni Gönderici Adresi Ekle
                  </button>
                )}
              </div>
              <div className="space-y-5">
                {/* Yeni Gönderici Formu */}
                {showNewSenderForm && (
                  <div className="rounded-[16px] bg-slate-50 p-6 border border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="text-[15px] font-bold text-slate-900">Yeni Gönderici Adresi</div>
                      <button onClick={() => { setShowNewSenderForm(false); setNewSenderAddr(EMPTY_ADDR); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200 text-slate-500"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-3">
                      <div className="sm:col-span-3">
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Adres Başlığı <span className="text-red-500">*</span></div>
                        <Input value={newSenderAddr.label} onChange={e => setNewSenderAddr(p => ({ ...p, label: e.target.value }))} placeholder="Örn: Ev, Ofis..." className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Ad Soyad <span className="text-red-500">*</span></div>
                        <Input value={newSenderAddr.name} onChange={e => setNewSenderAddr(p => ({ ...p, name: e.target.value }))} placeholder="Gönderici adı soyadı" className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Firma Adı</div>
                        <Input value={newSenderAddr.company} onChange={e => setNewSenderAddr(p => ({ ...p, company: e.target.value }))} placeholder="Firma adı (opsiyonel)" className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Telefon</div>
                        <Input value={newSenderAddr.phone} onChange={e => setNewSenderAddr(p => ({ ...p, phone: e.target.value }))} placeholder="+90 ..." className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Ülke <span className="text-red-500">*</span></div>
                        <div className="rounded-[12px] border border-slate-200 bg-white overflow-hidden shadow-sm h-[44px]">
                          <SearchableSelect
                            options={apiCountries}
                            value={newSenderAddr.countryCode}
                            onChange={v => setNewSenderAddr(p => ({ ...p, countryCode: v as string, stateProvince: "", postalCode: "" }))}
                            placeholder="Ülke seçiniz"
                            className="h-full border-0 focus:ring-0 bg-transparent text-[14px] font-medium px-3"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Eyalet / Bölge</div>
                        <Input value={newSenderAddr.stateProvince} onChange={e => setNewSenderAddr(p => ({ ...p, stateProvince: e.target.value }))} placeholder="Eyalet veya bölge" disabled={!newSenderAddr.countryCode} className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Şehir <span className="text-red-500">*</span></div>
                        <Input value={newSenderAddr.city} onChange={e => setNewSenderAddr(p => ({ ...p, city: e.target.value }))} placeholder="Şehir giriniz" className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Posta Kodu</div>
                        <Input value={newSenderAddr.postalCode} onChange={e => setNewSenderAddr(p => ({ ...p, postalCode: e.target.value }))} placeholder="Posta kodu" disabled={!newSenderAddr.countryCode} className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div className="sm:col-span-2">
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Açık Adres <span className="text-red-500">*</span></div>
                        <Input value={newSenderAddr.address} onChange={e => setNewSenderAddr(p => ({ ...p, address: e.target.value }))} placeholder="Sokak, cadde, bina no, daire no..." className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <button type="button" onClick={() => { setShowNewSenderForm(false); setNewSenderAddr(EMPTY_ADDR); }} className="px-5 py-2.5 rounded-full text-slate-600 font-bold hover:bg-slate-200 text-[13px] transition-colors">Vazgeç</button>
                      <button onClick={() => handleAddAddress("sender")} disabled={savingSender} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-bold transition-all shadow-sm disabled:opacity-50">
                        {savingSender ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet
                      </button>
                    </div>
                  </div>
                )}

                {loadingAddresses ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /><span className="ml-2 text-[13px] text-slate-500">Yükleniyor…</span></div>
                ) : senderAddresses.length === 0 ? (
                  <div className="rounded-[16px] bg-slate-50 p-8 flex flex-col items-center justify-center border border-dashed border-slate-200">
                    <MapPin className="h-8 w-8 text-slate-400 mb-3" />
                    <div className="text-[14px] font-bold text-slate-700">Kayıtlı gönderici adresi yok</div>
                    <div className="mt-1 text-[13px] text-slate-500">Yukarıdan yeni bir gönderici adresi ekleyin.</div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {senderAddresses.map((a) => (
                      <AddressCard key={a.id} addr={a} onDelete={() => handleRemoveAddress(a.id)} deleting={deletingAddrId === a.id} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── ALICI ADRESLERİ ── */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <MapPinned className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[17px] font-bold tracking-tight text-slate-900">Alıcı Adreslerim</h2>
                    <span className="text-[13px] text-slate-500">Gönderdiğiniz kişilerin adresleri</span>
                  </div>
                </div>
                {!showNewReceiverForm && (
                  <button
                    onClick={() => setShowNewReceiverForm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[13px] font-bold hover:bg-slate-100 transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Yeni Alıcı Adresi Ekle
                  </button>
                )}
              </div>
              <div className="space-y-5">
                {/* Yeni Alıcı Formu */}
                {showNewReceiverForm && (
                  <div className="rounded-[16px] bg-slate-50 p-6 border border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="text-[15px] font-bold text-slate-900">Yeni Alıcı Adresi</div>
                      <button onClick={() => { setShowNewReceiverForm(false); setNewReceiverAddr(EMPTY_ADDR); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200 text-slate-500"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-3">
                      <div className="sm:col-span-3">
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Adres Başlığı <span className="text-red-500">*</span></div>
                        <Input value={newReceiverAddr.label} onChange={e => setNewReceiverAddr(p => ({ ...p, label: e.target.value }))} placeholder="Örn: Berlin Ofisi, Müşteri X..." className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Ad Soyad <span className="text-red-500">*</span></div>
                        <Input value={newReceiverAddr.name} onChange={e => setNewReceiverAddr(p => ({ ...p, name: e.target.value }))} placeholder="Alıcı adı soyadı" className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Firma Adı</div>
                        <Input value={newReceiverAddr.company} onChange={e => setNewReceiverAddr(p => ({ ...p, company: e.target.value }))} placeholder="Firma adı (opsiyonel)" className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Telefon</div>
                        <Input value={newReceiverAddr.phone} onChange={e => setNewReceiverAddr(p => ({ ...p, phone: e.target.value }))} placeholder="+49 ..." className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Ülke <span className="text-red-500">*</span></div>
                        <div className="rounded-[12px] border border-slate-200 bg-white overflow-hidden shadow-sm h-[44px]">
                          <SearchableSelect
                            options={apiCountries}
                            value={newReceiverAddr.countryCode}
                            onChange={v => setNewReceiverAddr(p => ({ ...p, countryCode: v as string, stateProvince: "", postalCode: "" }))}
                            placeholder="Ülke seçiniz"
                            className="h-full border-0 focus:ring-0 bg-transparent text-[14px] font-medium px-3"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Eyalet / Bölge</div>
                        <Input value={newReceiverAddr.stateProvince} onChange={e => setNewReceiverAddr(p => ({ ...p, stateProvince: e.target.value }))} placeholder="Eyalet veya bölge" disabled={!newReceiverAddr.countryCode} className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Şehir <span className="text-red-500">*</span></div>
                        <Input value={newReceiverAddr.city} onChange={e => setNewReceiverAddr(p => ({ ...p, city: e.target.value }))} placeholder="Şehir giriniz" className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div>
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Posta Kodu</div>
                        <Input value={newReceiverAddr.postalCode} onChange={e => setNewReceiverAddr(p => ({ ...p, postalCode: e.target.value }))} placeholder="Posta kodu" disabled={!newReceiverAddr.countryCode} className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                      <div className="sm:col-span-2">
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Açık Adres <span className="text-red-500">*</span></div>
                        <Input value={newReceiverAddr.address} onChange={e => setNewReceiverAddr(p => ({ ...p, address: e.target.value }))} placeholder="Sokak, cadde, bina no, daire no..." className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <button type="button" onClick={() => { setShowNewReceiverForm(false); setNewReceiverAddr(EMPTY_ADDR); }} className="px-5 py-2.5 rounded-full text-slate-600 font-bold hover:bg-slate-200 text-[13px] transition-colors">Vazgeç</button>
                      <button onClick={() => handleAddAddress("receiver")} disabled={savingReceiver} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-[13px] font-bold transition-all shadow-sm disabled:opacity-50">
                        {savingReceiver ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet
                      </button>
                    </div>
                  </div>
                )}

                {loadingAddresses ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /><span className="ml-2 text-[13px] text-slate-500">Yükleniyor…</span></div>
                ) : receiverAddresses.length === 0 ? (
                  <div className="rounded-[16px] bg-slate-50 p-8 flex flex-col items-center justify-center border border-dashed border-slate-200">
                    <MapPinned className="h-8 w-8 text-slate-400 mb-3" />
                    <div className="text-[14px] font-bold text-slate-700">Kayıtlı alıcı adresi yok</div>
                    <div className="mt-1 text-[13px] text-slate-500">Yukarıdan yeni bir alıcı adresi ekleyin.</div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {receiverAddresses.map((a) => (
                      <AddressCard key={a.id} addr={a} onDelete={() => handleRemoveAddress(a.id)} deleting={deletingAddrId === a.id} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ ÖLÇÜLER ═══ */}
        {activeTab === "olcu" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <Box className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[17px] font-bold tracking-tight text-slate-900">Kayıtlı Ölçülerim</h2>
                    <span className="text-[13px] text-slate-500">Sık kullandığınız paket ebatları</span>
                  </div>
                </div>
                {!showNewMeasForm && (
                  <button
                    onClick={() => setShowNewMeasForm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[13px] font-bold hover:bg-slate-100 transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Yeni Ölçü Ekle
                  </button>
                )}
              </div>
              <div className="space-y-6">
                {showNewMeasForm && (
                  <div className="rounded-[16px] bg-slate-50 p-6 border border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="text-[15px] font-bold text-slate-900">Yeni Ölçü Ekle</div>
                      <button type="button" onClick={() => setShowNewMeasForm(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200 text-slate-500"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-5">
                      <label className="block sm:col-span-1">
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Ölçü Adı</div>
                        <Input value={newMeas.label} onChange={(e) => setNewMeas({ ...newMeas, label: e.target.value })} placeholder="Örn: Küçük Paket" className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px]" />
                      </label>
                      <label className="block sm:col-span-1">
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">En (cm)</div>
                        <div className="relative">
                          <Input inputMode="decimal" value={newMeas.widthCm} onChange={(e) => setNewMeas({ ...newMeas, widthCm: e.target.value })} placeholder="0" className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px] pr-10" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">cm</span>
                        </div>
                      </label>
                      <label className="block sm:col-span-1">
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Boy (cm)</div>
                        <div className="relative">
                          <Input inputMode="decimal" value={newMeas.lengthCm} onChange={(e) => setNewMeas({ ...newMeas, lengthCm: e.target.value })} placeholder="0" className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px] pr-10" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">cm</span>
                        </div>
                      </label>
                      <label className="block sm:col-span-1">
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Yükseklik (cm)</div>
                        <div className="relative">
                          <Input inputMode="decimal" value={newMeas.heightCm} onChange={(e) => setNewMeas({ ...newMeas, heightCm: e.target.value })} placeholder="0" className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px] pr-10" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">cm</span>
                        </div>
                      </label>
                      <label className="block sm:col-span-1">
                        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Ağırlık (kg)</div>
                        <div className="relative">
                          <Input inputMode="decimal" value={newMeas.weightKg} onChange={(e) => setNewMeas({ ...newMeas, weightKg: e.target.value })} placeholder="0" className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px] pr-10" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">kg</span>
                        </div>
                      </label>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <button onClick={handleAddMeasurement} disabled={savingMeas} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-[13px] font-bold transition-all shadow-sm disabled:opacity-50 shrink-0">
                        {savingMeas ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Ölçüyü Kaydet
                      </button>
                    </div>
                  </div>
                )}

                {loadingMeasurements ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-[13px] text-slate-500">Ölçüler yükleniyor…</span>
                  </div>
                ) : measurements.length === 0 ? (
                  <div className="rounded-[16px] bg-slate-50 p-8 flex flex-col items-center justify-center border border-dashed border-slate-200">
                    <Box className="h-8 w-8 text-slate-400 mb-3" />
                    <div className="text-[14px] font-bold text-slate-700">Kayıtlı ölçü bulunamadı</div>
                    <div className="mt-1 text-[13px] text-slate-500">Aynı ebatlardaki kutuları daha hızlı seçmek için ölçülerinizi kaydedin.</div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {measurements.map((m) => (
                      <div key={m.id} className="group relative flex items-center justify-between gap-4 rounded-[16px] p-5 border border-slate-200 bg-white transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 border border-slate-200 transition-colors group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100">
                            <Box className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-slate-900">{m.label}</div>
                            <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-slate-500">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{m.widthCm}</span> ×
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{m.lengthCm}</span> ×
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{m.heightCm}</span> cm
                              <span className="mx-1 text-slate-300">|</span>
                              <span className="text-[#2563EB] font-bold">{m.weightKg} kg</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMeasurement(m.id)}
                          disabled={deletingId === m.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Sil"
                        >
                          {deletingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ ŞİFRE ═══ */}
        {activeTab === "sifre" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Şifre Değiştir */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white shadow-sm">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold tracking-tight text-slate-900">Şifre Değiştir</h2>
                  <div className="text-[13px] text-slate-500 mt-0.5">Mevcut şifrenizi bilerek yeni şifre belirleyin</div>
                </div>
              </div>
              <div className="space-y-5">
                {passwordMessage && (
                  <div className={cn(
                    "rounded-[12px] p-4 text-[13px] font-medium shadow-sm border",
                    passwordMessage.type === "success"
                      ? "bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20"
                      : "bg-red-50 text-red-700 border-red-200"
                  )}>
                    {passwordMessage.text}
                  </div>
                )}
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <label className="block">
                    <div className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                      <KeyRound className="h-4 w-4 text-slate-400" /> Mevcut Şifre
                    </div>
                    <div className="relative">
                      <Input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Mevcut şifreniz"
                        className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px] pr-10"
                      />
                      <button type="button" onClick={() => setShowCurrentPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>
                  <label className="block">
                    <div className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                      <Lock className="h-4 w-4 text-slate-400" /> Yeni Şifre
                    </div>
                    <div className="relative">
                      <Input
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Yeni şifreniz (8-15 karakter)"
                        className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px] pr-10"
                      />
                      <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="mt-1.5 text-[11px] font-medium text-slate-400">En az 1 büyük, 1 küçük harf ve 1 rakam</div>
                  </label>
                  <label className="block">
                    <div className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                      <ShieldCheck className="h-4 w-4 text-slate-400" /> Şifre Tekrar
                    </div>
                    <div className="relative">
                      <Input
                        type={showConfirmPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Yeni şifrenizi tekrar girin"
                        className="h-[44px] rounded-[12px] border-slate-200 bg-white font-medium text-[14px] pr-10"
                      />
                      <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <button type="button" onClick={openForgotModal} className="text-[13px] font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline underline-offset-2 transition-colors">
                    Mevcut şifremi hatırlamıyorum
                  </button>
                  <button onClick={onChangePassword} disabled={savingPassword} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-bold transition-all shadow-sm shrink-0 disabled:opacity-50">
                    {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Şifreyi Güncelle
                  </button>
                </div>
              </div>
            </div>

            {/* Güvenlik İpuçları */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-slate-900">Güvenlik İpuçları</div>
                  <ul className="mt-3 space-y-1.5 text-[13px] text-slate-500 list-disc pl-4 font-medium">
                    <li>Şifrenizi düzenli olarak değiştirin</li>
                    <li>Büyük harf, küçük harf ve rakam kombinasyonu kullanın</li>
                    <li>Şifrenizi başka hiç kimseyle paylaşmayın</li>
                    <li>Her platform için farklı bir şifre kullanın</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ ŞİFREMİ UNUTTUM MODAL ═══ */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="relative w-full max-w-md rounded-[20px] bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Close */}
            <button onClick={closeForgotModal} className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[18px] font-bold text-slate-900">Şifremi Unuttum</div>
                <div className="text-[13px] text-slate-500 font-medium">
                  {forgotStep === 1 && "E-postanıza doğrulama kodu göndereceğiz"}
                  {forgotStep === 2 && "E-postanıza gelen 6 haneli kodu girin"}
                  {forgotStep === 3 && "Yeni şifrenizi belirleyin"}
                </div>
              </div>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center flex-1">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-all",
                    s < forgotStep ? "bg-[#10B981] text-white shadow-sm" :
                    s === forgotStep ? "bg-[#2563EB] text-white ring-4 ring-blue-50 shadow-sm" :
                    "bg-slate-50 text-slate-400 border border-slate-200"
                  )}>
                    {s < forgotStep ? "✓" : s}
                  </div>
                  {s < 3 && <div className={cn("h-1 flex-1 mx-2 rounded-full transition-colors", s < forgotStep ? "bg-[#10B981]" : "bg-slate-100")} />}
                </div>
              ))}
            </div>

            {forgotError && (
              <div className="mb-5 rounded-[12px] bg-red-50 p-3.5 text-[13px] font-medium text-red-700 border border-red-100 shadow-sm">{forgotError}</div>
            )}
            {forgotSuccess && (
              <div className="mb-5 rounded-[12px] bg-[#ECFDF5] p-3.5 text-[13px] font-medium text-[#10B981] border border-[#10B981]/20 shadow-sm">{forgotSuccess}</div>
            )}

            {/* Step 1: E-posta onayı */}
            {forgotStep === 1 && (
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-[13px] font-bold text-slate-700">E-posta Adresiniz</div>
                  <Input value={profile?.email || ""} disabled className="h-[48px] rounded-[14px] bg-slate-50 border-slate-200 text-slate-500 font-medium text-[14px]" />
                  <div className="mt-2 text-[12px] text-slate-500 font-medium">Bu adrese 6 haneli doğrulama kodu gönderilecek. Kodun geçerlilik süresi 10 dakikadır.</div>
                </div>
                <button
                  onClick={handleForgotSendCode}
                  disabled={forgotLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {forgotLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                  Doğrulama Kodu Gönder
                </button>
              </div>
            )}

            {/* Step 2: Kod girişi */}
            {forgotStep === 2 && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="text-[14px] font-bold text-slate-700 mb-1">Doğrulama Kodu</div>
                  <div className="text-[13px] text-slate-500"><span className="font-bold text-[#2563EB]">{profile?.email}</span> adresine gönderildi</div>
                </div>
                <div className="flex items-center justify-center gap-2.5">
                  {forgotCode.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => { codeInputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={e => handleCodeInput(idx, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(idx, e)}
                      onPaste={e => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
                        if (pasted) handleCodeInput(0, pasted);
                      }}
                      className={cn(
                        "h-14 w-12 rounded-[14px] border border-slate-200 bg-slate-50 text-center text-[20px] font-bold transition-all outline-none shadow-inner",
                        "focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white",
                        digit ? "border-blue-300 bg-blue-50 text-[#2563EB] shadow-none" : "text-slate-900"
                      )}
                    />
                  ))}
                </div>
                <div className="text-center text-[12px] text-slate-400 font-medium">Kod 10 dakika içinde geçerlidir. Kodu yapıştırarak da girebilirsiniz.</div>
                <button
                  onClick={handleForgotVerifyCode}
                  disabled={forgotLoading || forgotCode.join("").length !== 6}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {forgotLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  Kodu Doğrula
                </button>
                <button type="button" onClick={handleForgotSendCode} disabled={forgotLoading} className="w-full text-center text-[13px] font-bold text-[#2563EB] hover:underline underline-offset-2 disabled:opacity-50">
                  Kodu tekrar gönder
                </button>
              </div>
            )}

            {/* Step 3: Yeni şifre */}
            {forgotStep === 3 && !forgotSuccess && (
              <div className="space-y-4">
                <label className="block">
                  <div className="mb-2 text-[13px] font-bold text-slate-700">Yeni Şifre</div>
                  <div className="relative">
                    <Input
                      type={showForgotNewPw ? "text" : "password"}
                      value={forgotNewPw}
                      onChange={e => setForgotNewPw(e.target.value)}
                      placeholder="8-15 karakter"
                      className="h-[48px] rounded-[14px] border-slate-200 bg-white font-medium text-[14px] pr-10"
                    />
                    <button type="button" onClick={() => setShowForgotNewPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showForgotNewPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="mt-1.5 text-[11px] font-medium text-slate-400">En az 1 büyük, 1 küçük harf ve 1 rakam</div>
                </label>
                <label className="block">
                  <div className="mb-2 text-[13px] font-bold text-slate-700">Şifre Tekrar</div>
                  <div className="relative">
                    <Input
                      type={showForgotConfirmPw ? "text" : "password"}
                      value={forgotConfirmPw}
                      onChange={e => setForgotConfirmPw(e.target.value)}
                      placeholder="Yeni şifrenizi tekrar girin"
                      className="h-[48px] rounded-[14px] border-slate-200 bg-white font-medium text-[14px] pr-10"
                    />
                    <button type="button" onClick={() => setShowForgotConfirmPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showForgotConfirmPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </label>
                <button
                  onClick={handleForgotResetPassword}
                  disabled={forgotLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-[14px] font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {forgotLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Şifreyi Güncelle
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}