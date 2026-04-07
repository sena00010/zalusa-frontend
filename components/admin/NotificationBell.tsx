"use client";

import React from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

export function NotificationBell() {
  const router = useRouter();
  const { pendingCount, lastEvent, clearCount } = useAdminNotifications();

  // Toast görünürlüğü
  const [showToast, setShowToast] = React.useState(false);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Yeni event gelince toast göster
  React.useEffect(() => {
    if (!lastEvent) return;
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 4000);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [lastEvent]);

  function handleClick() {
    clearCount();
    router.push("/admin/kurye-talepleri");
  }

  return (
    <div className="relative">
      {/* Bell butonu */}
      <button
        onClick={handleClick}
        aria-label="Kurye bildirimleri"
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
          pendingCount > 0
            ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        }`}
      >
        <Bell className="h-5 w-5" />

        {/* Badge */}
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        )}
      </button>

      {/* Toast — yeni talep gelince */}
      {showToast && lastEvent && (
        <div
          style={{ animation: "zalusa-toast-in 0.25s ease" }}
          className="absolute right-0 top-12 z-50 w-64 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-100"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-base">
              🚚
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                Yeni Kurye Talebi
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {lastEvent.pickupCode}
              </p>
              <p className="text-xs text-slate-400">
                {lastEvent.pickupDate}
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="ml-auto shrink-0 text-slate-300 hover:text-slate-500"
              aria-label="Kapat"
            >
              ✕
            </button>
          </div>

          <button
            onClick={handleClick}
            className="mt-3 w-full rounded-xl bg-indigo-600 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Talepleri Görüntüle
          </button>
        </div>
      )}
    </div>
  );
}
