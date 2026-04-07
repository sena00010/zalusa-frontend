"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function PanelGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("zalusa.token");
    if (!token) {
      router.replace("/");
    }
  }, [router, pathname]);

  return <>{children}</>;
}
