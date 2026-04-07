"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

/* ─── Inner component ─────────────────────────────────────────────────────── */
function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const draftId = searchParams.get("draftId") || "";

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const API = process.env.NEXT_PUBLIC_API_URL || "";

  /* ── Countdown timer for resend ───────────────────────────────────── */
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  /* ── Auto-focus first input on mount ──────────────────────────────── */
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /* ── Handle digit input ───────────────────────────────────────────── */
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // only digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // single digit
    setCode(newCode);
    setError("");

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (newCode.every((d) => d !== "")) {
      submitCode(newCode.join(""));
    }
  };

  /* ── Handle backspace ─────────────────────────────────────────────── */
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /* ── Handle paste ─────────────────────────────────────────────────── */
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || "";
    }
    setCode(newCode);
    setError("");

    // Focus appropriate input
    const nextEmpty = newCode.findIndex((d) => d === "");
    if (nextEmpty >= 0) {
      inputRefs.current[nextEmpty]?.focus();
    } else {
      inputRefs.current[5]?.focus();
      submitCode(newCode.join(""));
    }
  };

  /* ── Submit verification code ─────────────────────────────────────── */
  const submitCode = async (fullCode: string) => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
        // Redirect after short delay
        setTimeout(() => {
          if (draftId) {
            router.replace(
              "/panel/gonderi-olustur?draft=" + draftId + "&quick=1"
            );
          } else {
            router.replace("/panel");
          }
        }, 1500);
      } else {
        setError(data?.error || "Doğrulama başarısız oldu.");
        // Clear code on error
        setCode(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError("Bir bağlantı hatası oluştu. Lütfen tekrar deneyin.");
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend code ──────────────────────────────────────────────────── */
  const handleResend = async () => {
    if (resending || countdown > 0) return;
    setResending(true);
    setResendMsg("");
    setError("");

    try {
      const res = await fetch(`${API}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendMsg("Yeni doğrulama kodu gönderildi!");
        setCountdown(60);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Kod tekrar gönderilemedi.");
      }
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setResending(false);
    }
  };

  /* ── Masked email helper ──────────────────────────────────────────── */
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_m, a, b, c) => a + "*".repeat(b.length) + c)
    : "";

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="zalusa-float-a absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="zalusa-float-b absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-400/10 blur-3xl" />
        <div className="zalusa-drift absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-accent-500/5 blur-3xl" />
      </div>

      {/* Main card */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-surface px-8 py-12 shadow-2xl ring-1 ring-border sm:px-12">
        {/* Logo */}
        <Image
          src="/logo-ikon.png"
          alt="Zalusa"
          width={48}
          height={48}
          priority
        />

        {success ? (
          /* ── Success state ─────────────────────────────────── */
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 ring-1 ring-success-600/20">
              <svg
                className="h-8 w-8 text-success-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-foreground">
                E-posta Doğrulandı!
              </h1>
              <p className="mt-2 text-sm text-muted">
                Hesabınız aktif edildi, yönlendiriliyorsunuz…
              </p>
            </div>
          </>
        ) : (
          /* ── Verification form ─────────────────────────────── */
          <>
            {/* Mail icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-600/20">
              <svg
                className="h-8 w-8 text-brand-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>

            <div className="text-center">
              <h1 className="text-lg font-semibold text-foreground">
                E-posta Doğrulama
              </h1>
              <p className="mt-2 text-sm text-muted">
                {maskedEmail
                  ? <>
                      <span className="font-medium text-foreground">{maskedEmail}</span>{" "}
                      adresine gönderilen 6 haneli kodu girin.
                    </>
                  : "E-posta adresinize gönderilen 6 haneli kodu girin."}
              </p>
            </div>

            {/* ── OTP Inputs ─────────────────────────────────── */}
            <div className="flex gap-2.5 sm:gap-3" onPaste={handlePaste}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={loading}
                  className="h-14 w-11 rounded-xl border border-border bg-surface-2 text-center text-xl font-bold text-foreground outline-none transition-all placeholder:text-muted-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 sm:h-16 sm:w-13"
                  style={{
                    caretColor: "var(--color-brand-600)",
                  }}
                />
              ))}
            </div>

            {/* Error message */}
            {error && (
              <p className="text-center text-sm font-medium text-danger-600">
                {error}
              </p>
            )}

            {/* Resend success message */}
            {resendMsg && (
              <p className="text-center text-sm font-medium text-success-600">
                {resendMsg}
              </p>
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <svg
                  className="h-4 w-4 animate-spin text-brand-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Doğrulanıyor…
              </div>
            )}

            {/* Resend link */}
            <div className="text-center text-sm text-muted">
              Kod gelmedi mi?{" "}
              {countdown > 0 ? (
                <span className="text-muted-2">
                  {countdown}s sonra tekrar gönder
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium text-brand-600 underline-offset-2 hover:underline disabled:opacity-50"
                >
                  {resending ? "Gönderiliyor…" : "Tekrar Gönder"}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Inline styles for custom animations */}
      <style jsx>{`
        @keyframes verifyFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Page wrapper with Suspense ──────────────────────────────────────────── */
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-sm text-muted">Yükleniyor…</div>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
