"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

/* ─── JWT decode helper (base64url → JSON) ─────────────────────────────────── */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/* ─── Inner component (useSearchParams needs Suspense boundary) ─────────────── */
function AutoLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const draftId = searchParams.get("draftId");

    if (!token) {
      setError(true);
      setTimeout(() => router.replace("/"), 2000);
      return;
    }

    // 1️⃣  JWT payload'dan customerId'yi çıkar
    const payload = decodeJwtPayload(token);
    const customerId =
      (payload?.customerId as string) ||
      (payload?.customer_id as string) ||
      (payload?.sub as string) ||
      "";

    // 2️⃣  Token ve customerId'yi localStorage'a kaydet
    localStorage.setItem("zalusa.token", token);
    if (customerId) {
      localStorage.setItem("zalusa.customerId", customerId);
    }

    // 3️⃣  GET /api/auth/me ile token geçerliliğini doğrula
    const API = process.env.NEXT_PUBLIC_API_URL || "";

    fetch(`${API}/api/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.ok) {
          // Token geçerli — customerId'yi response'dan güncelle (varsa)
          const data = await res.json().catch(() => ({}));
          if (data?.customerId) {
            localStorage.setItem("zalusa.customerId", data.customerId);
          }
          // Kullanıcı rolünü kaydet (sidebar bayi menüsü için)
          if (data?.role) {
            localStorage.setItem("zalusa.role", data.role);
          }

          // Doğrulanmamış kullanıcıyı OTP sayfasına yönlendir
          if (data?.isVerified === false) {
            const verifyUrl =
              "/auth/verify-email?email=" +
              encodeURIComponent(data.email || "") +
              (draftId ? "&draftId=" + draftId : "");
            router.replace(verifyUrl);
            return;
          }

          // Doğrulanmış kullanıcı — draftId varsa taslak sayfasına, yoksa panele
          if (draftId) {
            router.replace("/panel/gonderi-olustur?draft=" + draftId + "&quick=1");
          } else {
            router.replace("/panel");
          }
        } else {
          // Token geçersiz — temizle ve giriş sayfasına yönlendir
          localStorage.removeItem("zalusa.token");
          localStorage.removeItem("zalusa.customerId");
          setError(true);
          setTimeout(() => router.replace("/"), 2500);
        }
      })
      .catch(() => {
        // Ağ hatası — temizle ve giriş sayfasına yönlendir
        localStorage.removeItem("zalusa.token");
        localStorage.removeItem("zalusa.customerId");
        setError(true);
        setTimeout(() => router.replace("/"), 2500);
      });
  }, [searchParams, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="zalusa-float-a absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="zalusa-float-b absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-400/10 blur-3xl" />
        <div className="zalusa-drift absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-accent-500/5 blur-3xl" />
      </div>

      {/* Main card */}
      <div className="relative z-10 flex flex-col items-center gap-8 rounded-2xl bg-surface px-10 py-14 shadow-2xl ring-1 ring-border sm:px-16">
        {/* Logo */}
        <Image
          src="/logo-ikon.png"
          alt="Zalusa"
          width={56}
          height={56}
          priority
        />

        {error ? (
          /* ── Error State ─────────────────────────────────────────── */
          <>
            {/* Error icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-50 ring-1 ring-danger-600/20">
              <svg
                className="h-8 w-8 text-danger-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </div>

            <div className="text-center">
              <h1 className="text-lg font-semibold text-foreground">
                Giriş Yapılamadı
              </h1>
              <p className="mt-2 text-sm text-muted">
                Oturum bilgileri geçersiz veya süresi dolmuş.
                <br />
                Giriş sayfasına yönlendiriliyorsunuz…
              </p>
            </div>
          </>
        ) : (
          /* ── Loading State ────────────────────────────────────────── */
          <>
            {/* Spinner */}
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border-[3px] border-brand-100"
                style={{ borderTopColor: "var(--color-brand-600)" }}
              >
                <style jsx>{`
                  div {
                    animation: autoLoginSpin 0.8s linear infinite;
                  }
                  @keyframes autoLoginSpin {
                    to {
                      transform: rotate(360deg);
                    }
                  }
                `}</style>
              </div>
              {/* Pulsing inner dot */}
              <div className="h-3 w-3 rounded-full bg-brand-500" style={{ animation: "autoLoginPulse 1.5s ease-in-out infinite" }}>
                <style jsx>{`
                  @keyframes autoLoginPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.6); }
                  }
                `}</style>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-lg font-semibold text-foreground">
                Hesabınıza giriş yapılıyor
              </h1>
              <p className="mt-2 text-sm text-muted">
                Lütfen bekleyin, yönlendiriliyorsunuz…
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Page wrapper with Suspense (required for useSearchParams) ─────────────── */
export default function AutoLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-sm text-muted">Yükleniyor…</div>
        </div>
      }
    >
      <AutoLoginInner />
    </Suspense>
  );
}
