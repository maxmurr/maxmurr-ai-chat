import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/** Renders the shared sidebar frame around authenticated app content. */
export function AppSidebarFrame({
  children,
  className,
  sidebar,
}: {
  children: ReactNode;
  className?: string;
  sidebar: ReactNode;
}) {
  return (
    <SidebarProvider className={cn("isolate h-svh", className)}>
      {sidebar}
      <SidebarInset id="main-content" className="min-w-0 overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
