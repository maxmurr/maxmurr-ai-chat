import { Suspense, type ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
    <SidebarProvider className="isolate h-svh">
      {sidebar}
      <SidebarInset id="main-content" className="min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 px-3">
          <h1 className="sr-only">Settings</h1>
          <SidebarTrigger aria-label="Toggle sidebar" />
          <Separator
            className="data-vertical:h-4 data-vertical:self-auto"
            orientation="vertical"
          />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
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
