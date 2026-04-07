"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

interface PaymentButtonProps {
  shipmentId: number;
  label?: string;
  className?: string;
}

export function PaymentButton({
  shipmentId,
  label = "Ödeme Yap",
  className = "",
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("zalusa.token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ shipmentId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ödeme başlatılamadı.");
        setLoading(false);
        return;
      }

      if (data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      } else {
        setError("Ödeme sayfası URL'si alınamadı.");
        setLoading(false);
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="
          group relative inline-flex items-center justify-center gap-2.5
          w-full px-8 py-4 rounded-xl font-semibold text-base
          text-white cursor-pointer
          bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400
          hover:from-brand-700 hover:via-brand-600 hover:to-brand-500
          disabled:opacity-60 disabled:cursor-not-allowed
          shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30
          transition-all duration-300 ease-out
          active:scale-[0.98]
        "
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>İşleniyor...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span>{label}</span>
          </>
        )}

        {/* Shimmer effect */}
        {!loading && (
          <span
            className="
              absolute inset-0 rounded-xl overflow-hidden
              before:absolute before:inset-0
              before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
              before:translate-x-[-200%] group-hover:before:translate-x-[200%]
              before:transition-transform before:duration-700
            "
          />
        )}
      </button>

      {error && (
        <p className="mt-3 text-sm text-danger-600 text-center font-medium animate-in">
          {error}
        </p>
      )}
    </div>
  );
}
