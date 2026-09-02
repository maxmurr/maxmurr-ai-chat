import { Suspense, type ReactNode } from "react";

import { AppPageHeader } from "@/components/app-page-header";
import { AppSidebarFrame } from "@/components/app-sidebar-frame";
import { ActiveSettingsAppSidebar } from "@/features/settings/components/active-settings-app-sidebar";
import { SettingsAppSidebar } from "@/features/settings/components/settings-app-sidebar";

function SettingsAppFrameShell({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <AppSidebarFrame sidebar={sidebar}>
      <AppPageHeader>
        <h1 className="sr-only">Settings</h1>
      </AppPageHeader>
      {children}
    </AppSidebarFrame>
  );
}

/** Frames settings navigation around blank section content. */
export function SettingsAppFrame({ children }: { children: ReactNode }) {
  return (
    <SettingsAppFrameShell
      sidebar={
        <Suspense fallback={<SettingsAppSidebar />}>
          <ActiveSettingsAppSidebar />
        </Suspense>
      }
    >
      {children}
    </SettingsAppFrameShell>
  );
}

/** Prerenders blank settings frame while authentication resolves. */
export function SettingsAppFrameFallback() {
  return (
    <SettingsAppFrameShell sidebar={<SettingsAppSidebar />}>
      {null}
    </SettingsAppFrameShell>
  );
}
