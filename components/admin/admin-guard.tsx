"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("zalusa.admin.token");
    if (!token) {
      router.replace("/admin/login");
    }
  }, [router, pathname]);

  return <>{children}</>;
}
