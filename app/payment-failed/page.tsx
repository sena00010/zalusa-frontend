import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ödeme Başarısız | Zalusa",
  description: "Ödeme işlemi tamamlanamadı.",
};

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-danger-50 via-white to-warning-50 p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-200/20 rounded-full blur-3xl zalusa-float-a" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-orange-200/15 rounded-full blur-3xl zalusa-float-b" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-red-100/50 border border-red-100 p-10 text-center">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mb-6 shadow-lg shadow-red-300/40">
            <XCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ödeme Başarısız
          </h1>

          {/* Description */}
          <p className="text-gray-500 mb-8 leading-relaxed">
            Ödeme işlemi tamamlanamadı. Kart bilgilerinizi kontrol
            edip tekrar deneyebilirsiniz.
          </p>

          {/* Divider */}
          <div className="w-16 h-0.5 bg-gradient-to-r from-red-300 to-rose-300 mx-auto mb-8 rounded-full" />

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/panel/gonderilerim"
              className="
                inline-flex items-center justify-center gap-2 w-full
                px-6 py-3.5 rounded-xl font-semibold text-sm
                text-white
                bg-gradient-to-r from-red-500 to-rose-500
                hover:from-red-600 hover:to-rose-600
                shadow-md shadow-red-200/50 hover:shadow-lg
                transition-all duration-300
              "
            >
              <RotateCcw className="w-4 h-4" />
              Tekrar Dene
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
          Sorun devam ederse lütfen destek ekibimizle iletişime geçin.
        </p>
      </div>
    </div>
  );
}
