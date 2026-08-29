import type { ComponentProps, ReactNode } from "react"
import { CircleAlertIcon } from "lucide-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

type ErrorStateProps = ComponentProps<"section"> & {
  description: ReactNode
  icon?: ReactNode
  title: ReactNode
}

/** Presents a bounded recovery state inside any available content area. */
function ErrorState({
  children,
  className,
  description,
  icon = <CircleAlertIcon aria-hidden="true" className="size-5 text-destructive" />,
  title,
  ...props
}: ErrorStateProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 w-full flex-1 items-center justify-center p-6",
        className
      )}
      {...props}
    >
      <Empty className="max-w-md flex-none border-0 p-0">
        <EmptyHeader>
          <EmptyMedia>{icon}</EmptyMedia>
          <EmptyTitle className="text-lg">{title}</EmptyTitle>
          <EmptyDescription className="max-w-[50ch] text-base sm:text-sm">
            {description}
          </EmptyDescription>
        </EmptyHeader>
        {children && <EmptyContent>{children}</EmptyContent>}
      </Empty>
    </section>
  )
}

export { ErrorState }
