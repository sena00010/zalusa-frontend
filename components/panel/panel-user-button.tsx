"use client";

import React from "react";
import Link from "next/link";
import { User } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function PanelUserButton() {
  const [name, setName] = React.useState<string | null>(null);
  const [customerId, setCustomerId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const u = getCurrentUser();
    setName(u?.fullName ?? null);
    setCustomerId(u?.customerId ?? null);
  }, []);

  return (
    <Link href="/panel/profil" className="inline-flex">
      <Button variant="secondary" className="gap-2">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{name ?? "Profil"}</span>
        {customerId ? (
          <span className="hidden md:inline text-muted">• {customerId}</span>
        ) : null}
      </Button>
    </Link>
  );
}

