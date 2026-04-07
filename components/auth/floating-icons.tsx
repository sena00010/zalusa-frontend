import React from "react";
import {
  Barcode,
  Globe2,
  MapPin,
  Package,
  Plane,
  Truck,
} from "lucide-react";

import { cn } from "@/lib/cn";

type IconSpec = {
  Icon: React.ComponentType<{ className?: string }>;
  className: string;
  style: React.CSSProperties;
};

const ICONS: IconSpec[] = [
  {
    Icon: Truck,
    className: "zalusa-float-a",
    style: { top: "14%", left: "8%" },
  },
  {
    Icon: Package,
    className: "zalusa-float-b",
    style: { top: "28%", left: "22%" },
  },
  {
    Icon: Plane,
    className: "zalusa-drift zalusa-float-a",
    style: { top: "18%", right: "10%" },
  },
  {
    Icon: Globe2,
    className: "zalusa-float-b",
    style: { top: "60%", left: "10%" },
  },
  {
    Icon: MapPin,
    className: "zalusa-drift",
    style: { top: "68%", right: "18%" },
  },
  {
    Icon: Barcode,
    className: "zalusa-float-a",
    style: { top: "44%", right: "32%" },
  },
];

export function FloatingShippingIcons({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      {/* soft blobs */}
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand blur-3xl" />
      <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-brand blur-3xl" />
      <div className="absolute left-1/3 bottom-[-120px] h-80 w-80 rounded-full bg-accent-500/15 blur-3xl" />

      {ICONS.map(({ Icon, className: anim, style }, idx) => (
        <div
          key={idx}
          className={cn(
            "absolute hidden sm:block",
            "text-[#0708C0] drop-shadow-sm",
            anim,
          )}
          style={style}
        >
          <Icon className="h-12 w-12" />
        </div>
      ))}

      {/* Smaller icons for large screens */}
      <div className="absolute hidden lg:block zalusa-drift text-[#0708C0]" style={{ top: "40%", left: "46%" }}>
        <Package className="h-9 w-9" />
      </div>
      <div className="absolute hidden lg:block zalusa-float-b text-[#0708C0]" style={{ top: "22%", left: "58%" }}>
        <Truck className="h-10 w-10" />
      </div>
    </div>
  );
}

