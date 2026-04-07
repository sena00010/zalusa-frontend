"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CreditCard,
  Loader2,
  Package,
  ArrowLeft,
  Shield,
  CheckCircle,
} from "lucide-react";

interface ShipmentInfo {
  id: number;
  trackingCode: string;
  carrierName: string;
  carrierPriceTry: number;
  receiverCountry: string;
  shipmentType: string;
  hasInsurance: boolean;
  insuranceCost: number;
  totalPackageCount: number;
  chargeableWeight: number;
}

export default function OdemePage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params?.id as string;

  const [shipment, setShipment] = useState<ShipmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        const token = localStorage.getItem("zalusa.token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/shipments/${shipmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Gönderi bulunamadı");
        const data = await res.json();
        setShipment(data.shipment || data);
      } catch {
        setError("Gönderi bilgileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    if (shipmentId) fetchShipment();
  }, [shipmentId]);

  const handlePayment = async () => {
    setPaying(true);
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
          body: JSON.stringify({ shipmentId: Number(shipmentId) }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ödeme başlatılamadı.");
        setPaying(false);
        return;
      }

      if (data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      } else {
        setError("Ödeme sayfası URL'si alınamadı.");
        setPaying(false);
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error && !shipment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-danger-600 font-medium">{error}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </button>
      </div>
    );
  }

  const totalPrice = shipment
    ? shipment.carrierPriceTry + (shipment.hasInsurance ? shipment.insuranceCost : 0)
    : 0;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-brand-500" />
          Ödeme
        </h1>
        <p className="text-muted mt-1">
          Gönderiniz için ödeme işlemini tamamlayın.
        </p>
      </div>

      {/* Shipment Summary Card */}
      {shipment && (
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
            Gönderi Özeti
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Takip Kodu</span>
              <span className="text-sm font-mono font-semibold text-foreground">
                {shipment.trackingCode}
              </span>
            </div>

            {shipment.carrierName && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Kargo Firması</span>
                <span className="text-sm font-medium text-foreground">
                  {shipment.carrierName}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Hedef Ülke</span>
              <span className="text-sm font-medium text-foreground">
                {shipment.receiverCountry}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Paket Sayısı</span>
              <span className="text-sm font-medium text-foreground">
                {shipment.totalPackageCount} paket
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Ücretlendirilebilir Ağırlık</span>
              <span className="text-sm font-medium text-foreground">
                {shipment.chargeableWeight} kg
              </span>
            </div>

            <div className="border-t border-border my-3" />

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Kargo Ücreti</span>
              <span className="text-sm font-semibold text-foreground">
                ₺{shipment.carrierPriceTry?.toFixed(2)}
              </span>
            </div>

            {shipment.hasInsurance && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Sigorta
                </span>
                <span className="text-sm font-semibold text-foreground">
                  ₺{shipment.insuranceCost?.toFixed(2)}
                </span>
              </div>
            )}

            <div className="border-t border-border my-3" />

            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-foreground">Toplam</span>
              <span className="text-xl font-bold text-brand-600">
                ₺{totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6">
        <CheckCircle className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-brand-800">Güvenli Ödeme</p>
          <p className="text-xs text-brand-600 mt-0.5">
            Ödemeniz iyzico güvenli alışveriş altyapısı ile korunmaktadır.
          </p>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={paying}
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
        {paying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>İyzico&apos;ya yönlendiriliyor...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span>Ödeme Yap — ₺{totalPrice.toFixed(2)}</span>
          </>
        )}
      </button>

      {error && (
        <p className="mt-4 text-sm text-danger-600 text-center font-medium">
          {error}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <Package className="w-4 h-4 text-muted-2" />
        <p className="text-xs text-muted-2">
          Ödeme sonrası gönderiniz otomatik olarak işleme alınacaktır.
        </p>
      </div>
    </div>
  );
}
