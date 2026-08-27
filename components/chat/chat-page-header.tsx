import type { ComponentProps, ReactNode } from "react"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type ChatPageHeaderProps = ComponentProps<"header"> & {
  actions?: ReactNode
}

/** Renders shared sidebar trigger and content slot for app page headers. */
export function ChatPageHeader({
  actions,
  children,
  className,
  ...props
}: ChatPageHeaderProps) {
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
  )
}
