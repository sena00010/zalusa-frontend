"use client";

import React from "react";
import { UserCog, Eye, EyeOff, KeyRound, Save, CheckCircle2 } from "lucide-react";
import { adminService, type AdminUser } from "@/lib/services/adminService";

export default function AdminProfilePage() {
  const [me, setMe] = React.useState<AdminUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Password change
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newPassword2, setNewPassword2] = React.useState("");
  const [showOld, setShowOld] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showNew2, setShowNew2] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    adminService
      .getMe()
      .then(setMe)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== newPassword2) {
      setMessage({ type: "error", text: "Yeni şifreler eşleşmiyor." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Yeni şifre en az 6 karakter olmalıdır." });
      return;
    }

    setSaving(true);
    try {
      await adminService.changeMyPassword({ oldPassword, newPassword });
      setMessage({ type: "success", text: "Şifreniz başarıyla değiştirildi." });
      setOldPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Şifre değiştirme başarısız." });
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all";

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Profil</h1>
        <div className="h-60 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hesap bilgileriniz ve şifre değiştirme
        </p>
      </div>

      {/* Profile Info */}
      {me && (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              <UserCog className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">{me.fullName}</div>
              <div className="text-sm text-slate-500">{me.email}</div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="text-xs font-medium text-slate-400">Rol</div>
              <div className="text-sm font-semibold text-slate-700 mt-0.5">{me.role}</div>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="text-xs font-medium text-slate-400">Durum</div>
              <div className="text-sm font-semibold text-slate-700 mt-0.5">
                {me.isActive ? "✅ Aktif" : "❌ Pasif"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <KeyRound className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Şifre Değiştir</h2>
            <p className="text-xs text-slate-500">Mevcut şifrenizi kullanarak yeni bir şifre belirleyin</p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            {message.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {message.text}
          </div>
        )}

        <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Mevcut Şifre</label>
            <div className="relative">
              <input
                className={inputCls + " pr-10"}
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowOld((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Yeni Şifre</label>
            <div className="relative">
              <input
                className={inputCls + " pr-10"}
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Yeni Şifre (Tekrar)</label>
            <div className="relative">
              <input
                className={inputCls + " pr-10"}
                type={showNew2 ? "text" : "password"}
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew2((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showNew2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? "Kaydediliyor..." : "Şifreyi Değiştir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
