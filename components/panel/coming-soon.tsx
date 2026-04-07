import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  description = "Bu sayfa yakında aktif olacak.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold tracking-tight">{title}</div>
          <div className="mt-1 text-sm text-muted">{description}</div>
        </div>
        <Link href="/panel">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Panele dön
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

