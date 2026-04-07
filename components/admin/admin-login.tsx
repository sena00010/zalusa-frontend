"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, Eye, EyeOff, User, Phone } from "lucide-react";
import { adminService } from "@/lib/services/adminService";

export function AdminLogin() {
  const router = useRouter();
  const [tab, setTab] = React.useState<"login" | "register">("login");

  // Login
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);

  // Register
  const [regFirstName, setRegFirstName] = React.useState("");
  const [regLastName, setRegLastName] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPhone, setRegPhone] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [regPassword2, setRegPassword2] = React.useState("");
  const [showRegPw, setShowRegPw] = React.useState(false);
  const [showRegPw2, setShowRegPw2] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("zalusa.admin.token");
    if (token) router.replace("/admin");
  }, [router]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const data = await adminService.login({ email, password });
      localStorage.setItem("zalusa.admin.token", data.token);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Giriş başarısız.");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (regPassword !== regPassword2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (regPassword.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    setBusy(true);
    try {
      const data = await adminService.register({
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
        phone: regPhone || undefined,
      });
      setSuccess(data.message || "Admin başarıyla oluşturuldu! Giriş yapabilirsiniz.");
      setTab("login");
      setEmail(regEmail);
      setPassword("");
      // Clear register form
      setRegFirstName("");
      setRegLastName("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      setRegPassword2("");
    } catch (err: any) {
      setError(err.message || "Kayıt başarısız.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl bg-white/[0.06] border border-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] overflow-auto">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <div className="overflow-hidden rounded-3xl bg-white/[0.06] backdrop-blur-xl ring-1 ring-white/10 shadow-2xl">
          <div className="p-8 sm:p-10">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <Image src="/logo-ikon.png" alt="Zalusa" width={36} height={36} />
              </div>
              <div>
                <div className="text-center text-xl font-bold text-white">
                  {tab === "login" ? "Admin Girişi" : "Admin Kayıt"}
                </div>
                <div className="text-center text-sm text-white/50 mt-1">
                  Zalusa Yönetim Paneli
                </div>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="mb-6 flex rounded-xl bg-white/[0.06] p-1 ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => { setTab("login"); setError(null); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  tab === "login"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Giriş
              </button>
              <button
                type="button"
                onClick={() => { setTab("register"); setError(null); setSuccess(null); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  tab === "register"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
                {success}
              </div>
            )}

            {tab === "login" ? (
              <form onSubmit={onLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2">E-posta</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@zalusa.com"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2">Şifre</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={inputCls + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? "Giriş yapılıyor..." : "Giriş Yap"}
                </button>
              </form>
            ) : (
              <form onSubmit={onRegister} className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Ad</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        placeholder="Ad"
                        required
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Soyad</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        placeholder="Soyad"
                        required
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2">E-posta</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="admin@zalusa.com"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2">Telefon (opsiyonel)</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Şifre</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <input
                        type={showRegPw ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className={inputCls + " pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPw((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                        tabIndex={-1}
                      >
                        {showRegPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Şifre Tekrar</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <input
                        type={showRegPw2 ? "text" : "password"}
                        value={regPassword2}
                        onChange={(e) => setRegPassword2(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className={inputCls + " pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPw2((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                        tabIndex={-1}
                      >
                        {showRegPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password rules */}
                <ul className="space-y-1 text-xs">
                  {[
                    { ok: regPassword.length >= 8, label: "En az 8 karakter" },
                    { ok: /[A-Z]/.test(regPassword), label: "En az 1 büyük harf" },
                    { ok: /[a-z]/.test(regPassword), label: "En az 1 küçük harf" },
                    { ok: /[0-9]/.test(regPassword), label: "En az 1 rakam" },
                  ].map(({ ok, label }) => (
                    <li key={label} className={`flex items-center gap-2 ${
                      regPassword.length === 0
                        ? "text-white/25"
                        : ok
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        regPassword.length === 0
                          ? "bg-white/20"
                          : ok
                          ? "bg-emerald-400"
                          : "bg-red-400"
                      }`} />
                      {label}
                    </li>
                  ))}
                </ul>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? "Oluşturuluyor..." : "Admin Oluştur"}
                </button>
              </form>
            )}

            {/* Info */}
            <div className="mt-6 rounded-xl bg-white/[0.04] border border-white/5 px-4 py-3 text-center">
              <div className="text-xs text-white/40">
                {tab === "login"
                  ? "Şifrenizi unuttuysanız, sistem yöneticinize başvurun."
                  : "İlk admin hesabını oluşturduktan sonra giriş yapabilirsiniz."}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-white/30">
          © 2026 Zalusa. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
}
