import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type ProjectSectionHeaderProps = {
  action?: ReactNode
  className?: string
  title: string
}

/** Renders shared project section title and optional action slot. */
export function ProjectSectionHeader({
  action,
  className,
  title,
}: ProjectSectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-2", className)}>
      <h2 className="text-base font-medium sm:text-sm">{title}</h2>
      {action}
    </div>
  )
}
