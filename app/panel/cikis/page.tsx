"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CikisPage() {
  const router = useRouter();

  useEffect(() => {
    // JWT token'larını temizle (gerçek auth sistemi)
    localStorage.removeItem("zalusa.token");
    localStorage.removeItem("zalusa.customerId");
    localStorage.removeItem("zalusa.role");
    localStorage.removeItem("zalusa.fullName");
    // Taslak ve diğer önbellek verilerini temizle
    localStorage.removeItem("zalusa.shipmentDraft");
    localStorage.removeItem("zalusa.shipments");
    // Eski auth sistemi artıkları (varsa)
    localStorage.removeItem("zalusa.auth.currentUserEmail");

    router.replace("/");
  }, [router]);

  return null;
}
