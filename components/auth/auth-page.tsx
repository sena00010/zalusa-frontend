"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, CreditCard, Eye, EyeOff, KeyRound, Loader2, Mail, MapPin, PhoneCall, ShieldCheck, User, X, Save, ArrowLeft } from "lucide-react";
import { signInWithPopup } from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";
import { authService } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { profileService } from "@/lib/services/profileService";

type UserKind = "individual" | "corporate";

function KindSwitch({
  kind,
  setKind,
}: {
  kind: UserKind;
  setKind: (k: UserKind) => void;
}) {
  return (
    <div className="flex items-center gap-6">
      <label className="flex cursor-pointer items-center gap-2">
        <div
          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
            kind === "individual" ? "border-brand-600" : "border-border"
          }`}
        >
          {kind === "individual" && <div className="h-2 w-2 rounded-full bg-brand-600" />}
        </div>
        <span className="text-sm font-medium text-foreground">Bireysel</span>
        <input
          type="radio"
          name="kind"
          value="individual"
          checked={kind === "individual"}
          onChange={() => setKind("individual")}
          className="sr-only"
        />
      </label>

      <label className="flex cursor-pointer items-center gap-2">
        <div
          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
            kind === "corporate" ? "border-brand-600" : "border-border"
          }`}
        >
          {kind === "corporate" && <div className="h-2 w-2 rounded-full bg-brand-600" />}
        </div>
        <span className="text-sm font-medium text-foreground">Kurumsal</span>
        <input
          type="radio"
          name="kind"
          value="corporate"
          checked={kind === "corporate"}
          onChange={() => setKind("corporate")}
          className="sr-only"
        />
      </label>
    </div>
  );
}

export function AuthPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [tab, setTab] = React.useState<"login" | "register">("login");
  const [kind, setKind] = React.useState<UserKind>("individual");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phoneCode, setPhoneCode] = React.useState("TR (+90)");
  const [phone, setPhone] = React.useState("");

  const [tc, setTc] = React.useState("");
  const [taxNo, setTaxNo] = React.useState("");
  const [taxOffice, setTaxOffice] = React.useState("");
  const [address, setAddress] = React.useState("");

  const [kvkk, setKvkk] = React.useState(false);
  const [mailConsent, setMailConsent] = React.useState(false);

  const [message, setMessage] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showPassword2, setShowPassword2] = React.useState(false);

  // E-posta doğrulama (kayıt sonrası)
  const [showVerify, setShowVerify] = React.useState(false);
  const [verifyCode, setVerifyCode] = React.useState(["", "", "", "", "", ""]);
  const [verifyLoading, setVerifyLoading] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = React.useState<string | null>(null);
  const [resending, setResending] = React.useState(false);
  const verifyInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Şifremi unuttum modal
  const [showForgotModal, setShowForgotModal] = React.useState(false);
  const [forgotStep, setForgotStep] = React.useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [forgotLoading, setForgotLoading] = React.useState(false);
  const [forgotError, setForgotError] = React.useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = React.useState<string | null>(null);
  const [forgotCode, setForgotCode] = React.useState(["", "", "", "", "", ""]);
  const [forgotNewPw, setForgotNewPw] = React.useState("");
  const [forgotConfirmPw, setForgotConfirmPw] = React.useState("");
  const [showForgotNewPw, setShowForgotNewPw] = React.useState(false);
  const [showForgotConfirmPw, setShowForgotConfirmPw] = React.useState(false);
  const codeInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const pwRules = React.useMemo(() => ({
    length:  password.length >= 8 && password.length <= 15,
    digit:   /[0-9]/.test(password),
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
  }), [password]);

  const pwValid = Object.values(pwRules).every(Boolean);

  React.useEffect(() => {
    const token = localStorage.getItem("zalusa.token");
    const draftId = sp.get("draftId");
    
    if (token) {
      if (draftId) {
        router.replace(`/panel/gonderi-olustur?draft=${draftId}&quick=1`);
      } else {
        router.replace("/panel");
      }
      return;
    }

    const defaultEmail = sp.get("email");
    if (defaultEmail) {
      setEmail(defaultEmail);
    }

    const isNewUser = sp.get("newUser") === "true";
    if (isNewUser) {
      setInfoMessage("Hesabınız oluşturuldu! Sisteme giriş şifreniz e-posta adresinize gönderildi.");
    }

    const view = sp.get("view");
    if (view === "register") setTab("register");
  }, [router, sp]);

  function buildInvoice() {
    if (kind === "corporate") return { taxNo, taxOffice, address };
    return { tc, address };
  }

  async function onGoogleSignIn() {
    setMessage(null);
    setBusy(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const data = await authService.googleSignIn({ idToken });
      localStorage.setItem("zalusa.token", data.token);
      localStorage.setItem("zalusa.customerId", data.customerId);
      const draftId = sp.get("draftId");
      if (draftId) {
        router.push(`/panel/gonderi-olustur?draft=${draftId}&quick=1`);
      } else {
        router.push("/panel");
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setMessage("Giriş penceresi kapatıldı.");
      } else {
        setMessage(err.message || "Google ile giriş başarısız. Lütfen tekrar deneyin.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const data = await authService.login({ email, password });
      localStorage.setItem("zalusa.token", data.token);
      localStorage.setItem("zalusa.customerId", data.customerId);
      const draftId = sp.get("draftId");
      if (draftId) {
        router.push(`/panel/gonderi-olustur?draft=${draftId}&quick=1`);
      } else {
        router.push("/panel");
      }
    } catch (err: any) {
      setMessage(err.message || "Giriş başarısız.");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password !== password2) { setMessage("Şifreler eşleşmiyor."); return; }
    if (!pwValid) { setMessage("Şifre kuralları karşılanmıyor."); return; }
    if (!kvkk) { setMessage("KVKK onayını vermeniz gerekiyor."); return; }
    setBusy(true);
    try {
      const inv = buildInvoice();
      await authService.register({
        email, password,
        firstName, lastName, phone,
        kind,
        tc: (inv as any).tc || "",
        taxNo: (inv as any).taxNo || "",
        taxOffice: (inv as any).taxOffice || "",
        address: inv.address || "",
        kvkkAccepted: kvkk,
        mailConsent,
      });
      setShowVerify(true);
      setVerifyCode(["", "", "", "", "", ""]);
      setVerifyError(null);
      setVerifySuccess(null);
      setMessage(null);
      setTimeout(() => verifyInputRefs.current[0]?.focus(), 200);
    } catch (err: any) {
      setMessage(err.message || "Kayıt başarısız.");
    } finally {
      setBusy(false);
    }
  }

  // ── E-posta doğrulama (kayıt sonrası) ──────────────────────────────────
  function handleVerifyInput(index: number, value: string) {
    if (value.length > 1) {
      const digits = value.replace(/[^0-9]/g, "").slice(0, 6).split("");
      const newCode = [...verifyCode];
      digits.forEach((d, i) => { if (index + i < 6) newCode[index + i] = d; });
      setVerifyCode(newCode);
      const nextIdx = Math.min(index + digits.length, 5);
      verifyInputRefs.current[nextIdx]?.focus();
      return;
    }
    const digit = value.replace(/[^0-9]/g, "");
    const newCode = [...verifyCode];
    newCode[index] = digit;
    setVerifyCode(newCode);
    if (digit && index < 5) verifyInputRefs.current[index + 1]?.focus();
  }

  function handleVerifyKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !verifyCode[index] && index > 0) {
      verifyInputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyEmail() {
    const code = verifyCode.join("");
    if (code.length !== 6) { setVerifyError("Lütfen 6 haneli kodu eksiksiz girin."); return; }
    setVerifyLoading(true); setVerifyError(null);
    try {
      await authService.verifyEmail({ email, code });
      setVerifySuccess("E-posta doğrulandı! Giriş yapılıyor...");
      try {
        const loginRes = await authService.login({ email, password });
        localStorage.setItem("zalusa.token", loginRes.token);
        localStorage.setItem("zalusa.customerId", loginRes.customerId);
        const draftId = sp.get("draftId");
        if (draftId) {
          router.push(`/panel/gonderi-olustur?draft=${draftId}&quick=1`);
        } else {
          router.push("/panel");
        }
      } catch {
        setVerifySuccess("E-posta doğrulandı! Giriş yapabilirsiniz.");
        setTimeout(() => { setShowVerify(false); setTab("login"); }, 1500);
      }
    } catch (err: any) {
      setVerifyError(err.message || "Kod doğrulanamadı.");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleResendVerification() {
    setResending(true); setVerifyError(null);
    try {
      await authService.resendVerification({ email });
      setVerifyError(null);
      setVerifyCode(["", "", "", "", "", ""]);
      setMessage("Doğrulama kodu tekrar gönderildi.");
      setTimeout(() => setMessage(null), 3000);
      setTimeout(() => verifyInputRefs.current[0]?.focus(), 200);
    } catch (err: any) {
      setVerifyError(err.message || "Kod gönderilemedi.");
    } finally {
      setResending(false);
    }
  }

  // ── Şifremi unuttum akışı ──────────────────────────────────────────────
  function openForgotModal() {
    setShowForgotModal(true);
    setForgotStep(1);
    setForgotEmail(email);
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
    if (!forgotEmail) { setForgotError("Lütfen e-posta adresinizi girin."); return; }
    setForgotLoading(true); setForgotError(null);
    try {
      await profileService.forgotPassword(forgotEmail);
      setForgotStep(2);
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setForgotError(err.message || "Kod gönderilemedi.");
    } finally {
      setForgotLoading(false);
    }
  }

  function handleCodeInput(index: number, value: string) {
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
    const code = forgotCode.join("");
    if (code.length !== 6) { setForgotError("Lütfen 6 haneli kodu eksiksiz girin."); return; }
    setForgotLoading(true); setForgotError(null);
    try {
      await profileService.verifyResetCode(forgotEmail, code);
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err.message || "Kod doğrulanamadı.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleForgotResetPassword() {
    if (!forgotNewPw || !forgotConfirmPw) { setForgotError("Lütfen tüm alanları doldurun."); return; }
    if (forgotNewPw.length < 8 || forgotNewPw.length > 15) { setForgotError("Şifre 8-15 karakter arasında olmalıdır."); return; }
    if (!/[A-Z]/.test(forgotNewPw) || !/[a-z]/.test(forgotNewPw) || !/[0-9]/.test(forgotNewPw)) {
      setForgotError("Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir."); return;
    }
    if (forgotNewPw !== forgotConfirmPw) { setForgotError("Şifreler eşleşmiyor."); return; }
    setForgotLoading(true); setForgotError(null);
    try {
      const code = forgotCode.join("");
      await profileService.resetPassword(forgotEmail, code, forgotNewPw);
      setForgotSuccess("Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz.");
      setTimeout(() => { closeForgotModal(); setPassword(""); }, 2500);
    } catch (err: any) {
      setForgotError(err.message || "Şifre güncellenemedi.");
    } finally {
      setForgotLoading(false);
    }
  }

  /* ── Shared input style matching Figma ── */
  const fieldInputClass = "h-[40px] w-full rounded-[10px] border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#14141F] placeholder:text-[#94A3B8] outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-100 shadow-[0_1px_3px_rgba(0,0,0,0.08)]";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: "linear-gradient(180deg, #E8ECFB 0%, #D5DAF5 30%, #C8CFF0 50%, #DDE1F7 70%, #EFF1FC 100%)" }}>
      {/* Decorative blurred blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#c7d0f4] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#d4d9f6] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-white/20 blur-[150px]" />

      <main className="relative z-10 w-full max-w-[440px] px-4 py-10">
        {/* ── WHITE CARD ── */}
        <div className="rounded-[20px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="px-8 pt-10 pb-8">
            {/* Logo */}
            <div className="flex flex-col items-center gap-4 mb-2">
              <Link href="/" className="flex items-center justify-center bg-white" style={{ width: 56, height: 56, borderRadius: 10.5, border: "5px solid #AFB8E8" }}>
                <Image src="/logo-ikon.png" alt="Zalusa" width={36} height={36} />
              </Link>
              <div className="text-center">
                <h1 className="text-[20px] font-bold text-[#14141F] tracking-tight">
                  {showVerify ? "E-posta Doğrulama" : tab === "login" ? "Zalusa'ya Hoş Geldiniz." : "Hesap Oluşturun."}
                </h1>
                {!showVerify && (
                  <p className="mt-1.5 text-[14px] text-[#64748B] leading-relaxed">
                    {tab === "login"
                      ? "Şimdi giriş yapın, gönderilerinizi erişilebilir fiyat seçenekleriyle gönderin."
                      : "Hemen kayıt olun, en uygun kargo fiyatlarından yararlanın."}
                  </p>
                )}
              </div>
            </div>

            {/* ═══ Google Sign In ═══ */}
            {!showVerify && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={busy}
                  className="flex h-[44px] w-full items-center justify-center gap-3 rounded-[10px] bg-[#14141F] text-white text-[14px] font-semibold transition-all hover:bg-[#2a2a3a] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google ile Giriş Yap
                </button>
              </div>
            )}

            {/* ═══ Divider ═══ */}
            {!showVerify && (
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E2E8F0]" />
                </div>
                <div className="relative flex justify-center text-[13px]">
                  <span className="bg-white px-4 font-medium text-[#94A3B8]">Diğer seçenekler</span>
                </div>
              </div>
            )}

            {infoMessage && !showVerify && (
              <div className="mb-4 rounded-[10px] bg-emerald-50 p-3.5 text-[13px] text-emerald-700 ring-1 ring-emerald-200">
                {infoMessage}
              </div>
            )}
            
            {message && !showVerify ? (
              <div className="mb-4 rounded-[10px] bg-red-50 p-3.5 text-[13px] text-red-700 ring-1 ring-red-200">
                {message}
              </div>
            ) : null}

            {/* ═══ E-POSTA DOĞRULAMA EKRANI ═══ */}
            {showVerify ? (
              <div className="space-y-5 mt-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div className="flex items-center gap-3 rounded-[10px] bg-brand-50 p-4 ring-1 ring-brand-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-800">Doğrulama Kodu Gönderildi</div>
                    <div className="text-xs text-brand-600 mt-0.5">
                      <span className="font-semibold">{email}</span> adresine 6 haneli kod gönderildi.
                    </div>
                  </div>
                </div>

                {verifyError && (
                  <div className="rounded-[10px] bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{verifyError}</div>
                )}
                {verifySuccess && (
                  <div className="rounded-[10px] bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">{verifySuccess}</div>
                )}
                {message && (
                  <div className="rounded-[10px] bg-brand-50 p-3 text-sm text-brand-700 ring-1 ring-brand-100">{message}</div>
                )}

                {!verifySuccess && (
                  <>
                    <div className="text-center">
                      <div className="text-sm font-medium mb-3">Doğrulama Kodunu Girin</div>
                      <div className="flex items-center justify-center gap-2">
                        {verifyCode.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={el => { verifyInputRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={digit}
                            onChange={e => handleVerifyInput(idx, e.target.value)}
                            onKeyDown={e => handleVerifyKeyDown(idx, e)}
                            onPaste={e => {
                              e.preventDefault();
                              const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
                              if (pasted) handleVerifyInput(0, pasted);
                            }}
                            className={cn(
                              "h-12 w-11 rounded-xl border-2 bg-white text-center text-lg font-bold transition-all outline-none",
                              "focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
                              digit ? "border-brand-300 text-brand-700" : "border-[#E2E8F0] text-[#14141F]"
                            )}
                          />
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-[#94A3B8]">Kodu yapıştırarak da girebilirsiniz. Kodun süresi 15 dakikadır.</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      disabled={verifyLoading || verifyCode.join("").length !== 6}
                      className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#4F46E5] text-white text-[14px] font-semibold transition-all hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      Doğrula ve Giriş Yap
                    </button>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => { setShowVerify(false); setTab("login"); }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#94A3B8] hover:text-[#14141F] transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Giriş sayfasına dön
                      </button>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resending}
                        className="text-xs font-medium text-brand-600 hover:underline underline-offset-2 disabled:opacity-50"
                      >
                        {resending ? "Gönderiliyor..." : "Kodu tekrar gönder"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : tab === "login" ? (
              /* ═══ LOGIN FORM ═══ */
              <form className="space-y-5" onSubmit={onLogin}>
                {/* Mail Adresi */}
                <div>
                  <div className="mb-2 text-[13px] font-semibold text-[#14141F]">Mail Adresi</div>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="john-doe@example.com"
                      required
                      className={fieldInputClass}
                    />
                  </div>
                </div>

                {/* Şifre */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#14141F]">Şifre</span>
                    <button
                      type="button"
                      className="text-[13px] font-semibold text-[#4F46E5] hover:underline underline-offset-2 transition-colors"
                      onClick={openForgotModal}
                    >
                      Şifremi Unuttum
                    </button>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Şifreniz"
                      required
                      className={cn(fieldInputClass, "pr-10")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#14141F] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={busy}
                  className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#4F46E5] text-white text-[14px] font-semibold transition-all hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Mail Adresiyle Giriş Yap
                </button>
              </form>
            ) : (
              /* ═══ REGISTER FORM ═══ */
              <form className="space-y-4" onSubmit={onRegister}>
                {/* Kind switch */}
                <div className="flex justify-center mb-1">
                  <KindSwitch kind={kind} setKind={(k) => { setKind(k); setMessage(null); }} />
                </div>

                {/* Kişisel bilgiler */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><User className="h-4 w-4" /></div>
                    <input placeholder="Ad" value={firstName} onChange={e => setFirstName(e.target.value)} required className={fieldInputClass} />
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><User className="h-4 w-4" /></div>
                    <input placeholder="Soyad" value={lastName} onChange={e => setLastName(e.target.value)} required className={fieldInputClass} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-2/5 relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><PhoneCall className="h-4 w-4" /></div>
                    <input placeholder="Ülke Kodu" value={phoneCode} onChange={e => setPhoneCode(e.target.value)} required className={fieldInputClass} />
                  </div>
                  <div className="w-3/5 relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><PhoneCall className="h-4 w-4" /></div>
                    <input placeholder="Telefon Numarası" value={phone} onChange={e => setPhone(e.target.value)} required className={fieldInputClass} />
                  </div>
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><Mail className="h-4 w-4" /></div>
                  <input type="email" placeholder="Mail" value={email} onChange={e => setEmail(e.target.value)} required className={fieldInputClass} />
                </div>

                {/* Fatura bilgileri */}
                {kind === "individual" ? (
                  <>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><CreditCard className="h-4 w-4" /></div>
                      <input placeholder="TC Kimlik No" value={tc} onChange={e => setTc(e.target.value)} required className={fieldInputClass} />
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><MapPin className="h-4 w-4" /></div>
                      <input placeholder="Adres" value={address} onChange={e => setAddress(e.target.value)} required className={fieldInputClass} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><CreditCard className="h-4 w-4" /></div>
                      <input placeholder="Vergi No" value={taxNo} onChange={e => setTaxNo(e.target.value)} required className={fieldInputClass} />
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><Building2 className="h-4 w-4" /></div>
                      <input placeholder="Vergi Dairesi" value={taxOffice} onChange={e => setTaxOffice(e.target.value)} required className={fieldInputClass} />
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><MapPin className="h-4 w-4" /></div>
                      <input placeholder="Adres" value={address} onChange={e => setAddress(e.target.value)} required className={fieldInputClass} />
                    </div>
                  </>
                )}

                {/* Şifre */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><KeyRound className="h-4 w-4" /></div>
                    <input
                      placeholder="Şifre"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      required
                      className={cn(fieldInputClass, "pr-10")}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#14141F] transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><KeyRound className="h-4 w-4" /></div>
                    <input
                      placeholder="Şifre (tekrar)"
                      value={password2}
                      onChange={e => setPassword2(e.target.value)}
                      type={showPassword2 ? "text" : "password"}
                      required
                      className={cn(fieldInputClass, "pr-10")}
                    />
                    <button type="button" onClick={() => setShowPassword2(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#14141F] transition-colors" tabIndex={-1}>
                      {showPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Validation rules */}
                <ul className="space-y-1.5 text-xs">
                  {([
                    { key: "length", label: "8-15 karakter" },
                    { key: "digit",  label: "En az 1 rakam (0-9)" },
                    { key: "upper",  label: "En az 1 büyük harf" },
                    { key: "lower",  label: "En az 1 küçük harf" },
                  ] as const).map(({ key, label }) => {
                    const ok = password.length > 0 && pwRules[key];
                    const bad = password.length > 0 && !pwRules[key];
                    return (
                      <li key={key} className={`flex items-center gap-2 font-medium transition-colors ${
                        ok ? "text-emerald-600" : bad ? "text-red-500" : "text-[#94A3B8]"
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          ok ? "bg-emerald-500" : bad ? "bg-red-400" : "bg-[#CBD5E1]"
                        }`} />
                        {label}
                      </li>
                    );
                  })}
                </ul>

                {/* KVKK */}
                <div className="grid gap-3 rounded-[10px] bg-[#F8FAFC] p-4 ring-1 ring-[#E2E8F0]">
                  <Checkbox
                    checked={kvkk}
                    onChange={setKvkk}
                    label={<span className="text-[#14141F]/85">KVKK onayını veriyorum.</span>}
                  />
                  <Checkbox
                    checked={mailConsent}
                    onChange={setMailConsent}
                    label={<span className="text-[#14141F]/85">Mail ile iletişim kurulabilmesi için onay veriyorum.</span>}
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#4F46E5] text-white text-[14px] font-semibold transition-all hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Kayıt Ol
                </button>
              </form>
            )}

            {/* ── Yardım Kutusu ── */}
            {!showVerify && (
              <div className="mt-6 rounded-[10px] bg-[#F8FAFC] p-5 text-center">
                <div className="text-[14px] font-bold text-[#14141F]">Yardıma mı ihtiyacın var?</div>
                <div className="mt-1.5 text-[13px] text-[#94A3B8] leading-relaxed">
                  <span className="font-semibold text-[#4F46E5]">0850 333 0011</span> numarası üzerinden<br />
                  Müşteri Hizmetleri&apos;ni arayabilirsin.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom link (outside card) ── */}
        {!showVerify && (
          <div className="mt-6 text-center text-[14px] text-[#64748B]">
            {tab === "login" ? (
              <>
                Henüz bir hesabınız yok mu?{" "}
                <button type="button" onClick={() => setTab("register")} className="font-semibold text-[#4F46E5] hover:underline underline-offset-2">
                  Şimdi kayıt olun
                </button>
              </>
            ) : (
              <>
                Zaten bir hesabınız var mı?{" "}
                <button type="button" onClick={() => setTab("login")} className="font-semibold text-[#4F46E5] hover:underline underline-offset-2">
                  Giriş yapın
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* ═══ ŞİFREMİ UNUTTUM MODAL ═══ */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative mx-4 w-full max-w-md rounded-[20px] bg-white p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <button onClick={closeForgotModal} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F8FAFC] text-[#94A3B8] transition-colors">
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-bold text-[#14141F]">Şifremi Unuttum</div>
                <div className="text-xs text-[#94A3B8]">
                  {forgotStep === 1 && "E-postanıza doğrulama kodu göndereceğiz"}
                  {forgotStep === 2 && "E-postanıza gelen 6 haneli kodu girin"}
                  {forgotStep === 3 && "Yeni şifrenizi belirleyin"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center flex-1">
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                    s < forgotStep ? "bg-emerald-500 text-white" :
                    s === forgotStep ? "bg-[#4F46E5] text-white ring-4 ring-[#EEF2FF]" :
                    "bg-[#F8FAFC] text-[#94A3B8] ring-1 ring-[#E2E8F0]"
                  )}>
                    {s < forgotStep ? "✓" : s}
                  </div>
                  {s < 3 && <div className={cn("h-0.5 flex-1 mx-1 rounded-full transition-colors", s < forgotStep ? "bg-emerald-400" : "bg-[#E2E8F0]")} />}
                </div>
              ))}
            </div>

            {forgotError && (
              <div className="mb-4 rounded-[10px] bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{forgotError}</div>
            )}
            {forgotSuccess && (
              <div className="mb-4 rounded-[10px] bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">{forgotSuccess}</div>
            )}

            {/* Step 1 */}
            {forgotStep === 1 && (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-sm font-semibold text-[#14141F]">E-posta Adresiniz</div>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><Mail className="h-4 w-4" /></div>
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="ornek@mail.com" className={fieldInputClass} />
                  </div>
                  <div className="mt-2 text-xs text-[#94A3B8]">Bu adrese 6 haneli doğrulama kodu gönderilecek. Kodun geçerlilik süresi 10 dakikadır.</div>
                </div>
                <button type="button" onClick={handleForgotSendCode} disabled={forgotLoading} className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#4F46E5] text-white text-[14px] font-semibold transition-all hover:bg-[#4338CA] disabled:opacity-50">
                  {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Doğrulama Kodu Gönder
                </button>
              </div>
            )}

            {/* Step 2 */}
            {forgotStep === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-sm font-semibold mb-1">Doğrulama Kodu</div>
                  <div className="text-xs text-[#94A3B8]"><span className="font-semibold text-[#4F46E5]">{forgotEmail}</span> adresine gönderildi</div>
                </div>
                <div className="flex items-center justify-center gap-2">
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
                        "h-12 w-11 rounded-xl border-2 bg-white text-center text-lg font-bold transition-all outline-none",
                        "focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF]",
                        digit ? "border-[#4F46E5]/40 text-[#4F46E5]" : "border-[#E2E8F0] text-[#14141F]"
                      )}
                    />
                  ))}
                </div>
                <div className="text-center text-xs text-[#94A3B8]">Kod 10 dakika içinde geçerlidir. Kodu yapıştırarak da girebilirsiniz.</div>
                <button type="button" onClick={handleForgotVerifyCode} disabled={forgotLoading || forgotCode.join("").length !== 6} className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#4F46E5] text-white text-[14px] font-semibold transition-all hover:bg-[#4338CA] disabled:opacity-50">
                  {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Kodu Doğrula
                </button>
                <button type="button" onClick={handleForgotSendCode} disabled={forgotLoading} className="w-full text-center text-xs font-medium text-[#4F46E5] hover:underline underline-offset-2 disabled:opacity-50">
                  Kodu tekrar gönder
                </button>
              </div>
            )}

            {/* Step 3 */}
            {forgotStep === 3 && !forgotSuccess && (
              <div className="space-y-4">
                <label className="block">
                  <div className="mb-2 text-sm font-semibold text-[#14141F]">Yeni Şifre</div>
                  <div className="relative">
                    <input
                      type={showForgotNewPw ? "text" : "password"}
                      value={forgotNewPw}
                      onChange={e => setForgotNewPw(e.target.value)}
                      placeholder="8-15 karakter"
                      className={cn(fieldInputClass, "pl-4 pr-10")}
                    />
                    <button type="button" onClick={() => setShowForgotNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#14141F]">
                      {showForgotNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-1 text-[11px] text-[#94A3B8]">En az 1 büyük, 1 küçük harf ve 1 rakam</div>
                </label>
                <label className="block">
                  <div className="mb-2 text-sm font-semibold text-[#14141F]">Şifre Tekrar</div>
                  <div className="relative">
                    <input
                      type={showForgotConfirmPw ? "text" : "password"}
                      value={forgotConfirmPw}
                      onChange={e => setForgotConfirmPw(e.target.value)}
                      placeholder="Yeni şifrenizi tekrar girin"
                      className={cn(fieldInputClass, "pl-4 pr-10")}
                    />
                    <button type="button" onClick={() => setShowForgotConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#14141F]">
                      {showForgotConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
                <button type="button" onClick={handleForgotResetPassword} disabled={forgotLoading} className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#4F46E5] text-white text-[14px] font-semibold transition-all hover:bg-[#4338CA] disabled:opacity-50">
                  {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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