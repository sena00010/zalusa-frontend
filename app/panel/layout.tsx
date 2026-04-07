import type { Metadata } from "next";

import { PanelShell } from "@/components/panel/panel-shell";
import { PanelGuard } from "@/components/panel/panel-guard";
import { PanelHeaderActions } from "@/components/panel/panel-header-actions";
import { ChatWidgetLoader } from "@/components/ChatWidgetLoader";

export const metadata: Metadata = {
  title: "Zalusa | Panel",
};

export default function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PanelGuard>
      <PanelShell right={<PanelHeaderActions />}>
        {children}
      </PanelShell>
      <ChatWidgetLoader />
    </PanelGuard>
  );
}

