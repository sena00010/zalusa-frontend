"use client";

import React from "react";
import {
  Users,
  Plus,
  Eye,
  EyeOff,
  KeyRound,
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  Phone,
} from "lucide-react";
import { adminService, type AdminUser } from "@/lib/services/adminService";

// ── Toast notification ──────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-[fadeInUp_0.3s_ease] max-w-sm">
      <div
        className={`flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-lg ring-1 ${
          type === "success"
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-red-50 text-red-700 ring-red-200"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 shrink-0 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all";

export default function AdminManagementPage() {
  const [admins, setAdmins] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [showCreatePw, setShowCreatePw] = React.useState(false);
  const [createBusy, setCreateBusy] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Change password modal
  const [pwModal, setPwModal] = React.useState<{ id: string; name: string } | null>(null);
  const [newPw, setNewPw] = React.useState("");
  const [showNewPw, setShowNewPw] = React.useState(false);
  const [pwBusy, setPwBusy] = React.useState(false);
  const [pwError, setPwError] = React.useState<string | null>(null);

  async function load() {
    try {
      const data = await adminService.listAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function onCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateBusy(true);
    try {
      await adminService.createAdmin({
        email: createForm.email,
        password: createForm.password,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        phone: createForm.phone || undefined,
      });
      setShowCreate(false);
      setCreateForm({ email: "", password: "", firstName: "", lastName: "", phone: "" });
      setToast({ type: "success", text: "Admin başarıyla oluşturuldu." });
      await load();
    } catch (err: any) {
      setCreateError(err.message || "Admin oluşturulamadı.");
    } finally {
      setCreateBusy(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwModal) return;
    setPwError(null);
    setPwBusy(true);
    try {
      await adminService.changeAdminPassword(pwModal.id, { password: newPw });
      setPwModal(null);
      setNewPw("");
      setToast({ type: "success", text: "Şifre başarıyla değiştirildi." });
    } catch (err: any) {
      setPwError(err.message || "Şifre değiştirilemedi.");
    } finally {
      setPwBusy(false);
    }
  }

  async function toggleStatus(admin: AdminUser) {
    try {
      await adminService.updateAdminStatus(admin.id, { isActive: !admin.isActive });
      setToast({ type: "success", text: `Admin ${!admin.isActive ? "aktif" : "pasif"} yapıldı.` });
      await load();
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Durum güncellenemedi." });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Yönetimi</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500">Admin hesaplarını yönetin</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(null); }}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Yeni Admin
        </button>
      </div>

      {admins.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-100">
          <Users className="inline-block h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">Henüz admin hesabı yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                  <Shield className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{a.fullName || `${(a as any).firstName || ""} ${(a as any).lastName || ""}`.trim()}</div>
                  <div className="text-xs text-slate-500">{a.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStatus(a)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    a.isActive
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      : "bg-red-50 text-red-500 hover:bg-red-100"
                  }`}
                >
                  {a.isActive ? "Aktif" : "Pasif"}
                </button>
                <button
                  onClick={() => { setPwModal({ id: a.id, name: a.fullName || (a as any).firstName || "Admin" }); setNewPw(""); setShowNewPw(false); setPwError(null); }}
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100 transition-colors"
                  title="Şifre değiştir"
                >
                  <KeyRound className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Admin Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Yeni Admin Oluştur">
        <form onSubmit={onCreateAdmin} className="space-y-4">
          {createError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {createError}
            </div>
          )}
          <div className="grid gap-4 grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ad</label>
              <input className={inputCls} value={createForm.firstName} onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Soyad</label>
              <input className={inputCls} value={createForm.lastName} onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">E-posta</label>
            <input className={inputCls} type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Telefon (opsiyonel)</label>
            <input className={inputCls} value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} placeholder="05XX XXX XX XX" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Şifre</label>
            <div className="relative">
              <input
                className={inputCls + " pr-10"}
                type={showCreatePw ? "text" : "password"}
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={8}
              />
              <button type="button" onClick={() => setShowCreatePw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                {showCreatePw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              İptal
            </button>
            <button type="submit" disabled={createBusy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {createBusy ? "Oluşturuluyor..." : "Oluştur"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={!!pwModal} onClose={() => setPwModal(null)} title={`Şifre Değiştir — ${pwModal?.name || ""}`}>
        <form onSubmit={onChangePassword} className="space-y-4">
          {pwError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {pwError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Yeni Şifre</label>
            <div className="relative">
              <input
                className={inputCls + " pr-10"}
                type={showNewPw ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowNewPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPwModal(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              İptal
            </button>
            <button type="submit" disabled={pwBusy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {pwBusy ? "Kaydediliyor..." : "Şifreyi Değiştir"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}
    </div>
  );
}
