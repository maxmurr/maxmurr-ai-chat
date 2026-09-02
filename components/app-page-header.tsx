import type { ComponentProps, ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type AppPageHeaderProps = ComponentProps<"header"> & {
  actions?: ReactNode;
};

/** Renders the sidebar trigger, title slot, and actions for an app page. */
export function AppPageHeader({
  actions,
  children,
  className,
  ...props
}: AppPageHeaderProps) {
  return (
    <header
      className={cn("flex h-14 shrink-0 items-center gap-2 px-3", className)}
      {...props}
    >
      <SidebarTrigger aria-label="Toggle sidebar" />
      <Separator
        className="data-vertical:h-4 data-vertical:self-auto"
        orientation="vertical"
      />
      <div className="min-w-0 flex-1 pl-2">{children}</div>
      {actions && (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      )}
    </header>
  );
}
