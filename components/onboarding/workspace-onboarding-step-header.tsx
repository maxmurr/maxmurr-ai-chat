import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type WorkspaceOnboardingStepHeaderProps = {
  className?: string
  description: ReactNode
  title: string
  titleId: string
}

/** Renders shared heading group for each workspace onboarding step. */
export function WorkspaceOnboardingStepHeader({
  className,
  description,
  title,
  titleId,
}: WorkspaceOnboardingStepHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-2", className)}>
      <h1
        className="text-balance text-2xl font-semibold tracking-tight"
        id={titleId}
      >
        {title}
      </h1>
      <p className="text-pretty text-base/7 text-muted-foreground sm:text-sm/6">
        {description}
      </p>
    </header>
  )
}
