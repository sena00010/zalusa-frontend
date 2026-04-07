"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { adminService } from "@/lib/services/adminService";

const API = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = "zalusa.admin.token";

function playDing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880; // La notu
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // AudioContext desteklenmiyorsa sessizce atla
  }
}

export interface NewCourierEvent {
  pickupId: number;
  pickupCode: string;
  pickupDate: string;
}

export function useAdminNotifications() {
  const [pendingCount, setPendingCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<NewCourierEvent | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mevcut pending sayısını çek
  const fetchStats = useCallback(async () => {
    try {
      const stats = await adminService.getCourierStats();
      setPendingCount(Number(stats?.pending ?? 0));
    } catch {
      // sessizce hata yut
    }
  }, []);

  const connect = useCallback(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(TOKEN_KEY)
        : null;
    if (!token) return;

    // Önceki bağlantıyı kapat
    esRef.current?.close();

    const url = `${API}/api/admin/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("new_courier_request", (e) => {
      try {
        const wrapper = JSON.parse(e.data);
        const payload: NewCourierEvent =
          typeof wrapper.payload === "string"
            ? JSON.parse(wrapper.payload)
            : wrapper.payload;
        playDing();
        setPendingCount((n) => n + 1);
        setLastEvent(payload);
      } catch {
        playDing();
        setPendingCount((n) => n + 1);
      }
    });

    es.onerror = () => {
      es.close();
      // 5 saniye sonra yeniden bağlan
      retryRef.current = setTimeout(() => connect(), 5000);
    };
  }, []);

  useEffect(() => {
    fetchStats();
    connect();

    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [fetchStats, connect]);

  /** Bell'e tıklanınca sayacı sıfırla */
  const clearCount = useCallback(() => {
    setPendingCount(0);
    setLastEvent(null);
  }, []);

  return { pendingCount, lastEvent, clearCount };
}
