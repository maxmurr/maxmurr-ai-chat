import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";

import { AuthenticatedSettingsApp } from "@/features/settings/components/authenticated-settings-app";
import { SettingsAppFrameFallback } from "@/features/settings/components/settings-app-frame";

export const metadata: Metadata = {
  title: "Settings – AI Chat",
};

/** Composes guarded settings shell around section routes. */
export default function AdminSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<SettingsAppFrameFallback />}>
      <AuthenticatedSettingsApp>{children}</AuthenticatedSettingsApp>
    </Suspense>
  );
}
