import { CheckCircle, ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ödeme Başarılı | Zalusa",
  description: "Ödemeniz başarıyla tamamlandı.",
};

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-success-50 via-white to-brand-50 p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-200/20 rounded-full blur-3xl zalusa-float-a" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-200/15 rounded-full blur-3xl zalusa-float-b" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-green-100/50 border border-green-100 p-10 text-center">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-green-300/40">
            <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ödeme Başarılı!
          </h1>

          {/* Description */}
          <p className="text-gray-500 mb-8 leading-relaxed">
            Ödemeniz başarıyla tamamlandı. Gönderiniz en kısa sürede
            işleme alınacaktır.
          </p>

          {/* Divider */}
          <div className="w-16 h-0.5 bg-gradient-to-r from-green-300 to-emerald-300 mx-auto mb-8 rounded-full" />

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/panel/gonderilerim"
              className="
                inline-flex items-center justify-center gap-2 w-full
                px-6 py-3.5 rounded-xl font-semibold text-sm
                text-white
                bg-gradient-to-r from-green-500 to-emerald-500
                hover:from-green-600 hover:to-emerald-600
                shadow-md shadow-green-200/50 hover:shadow-lg
                transition-all duration-300
              "
            >
              <Package className="w-4 h-4" />
              Gönderilerimi Görüntüle
            </Link>

            <Link
              href="/panel"
              className="
                inline-flex items-center justify-center gap-2 w-full
                px-6 py-3.5 rounded-xl font-semibold text-sm
                text-gray-600 bg-gray-50 hover:bg-gray-100
                border border-gray-200
                transition-all duration-300
              "
            >
              <ArrowLeft className="w-4 h-4" />
              Panele Dön
            </Link>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-gray-400 mt-6">
          İşleminiz güvenli ödeme altyapısı ile gerçekleştirilmiştir.
        </p>
      </div>
    </div>
  );
}
