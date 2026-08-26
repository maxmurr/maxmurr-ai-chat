import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** Expands compact chat controls to minimum coarse-pointer target size. */
export function ChatTouchTarget({
  className,
  ...props
}: Omit<ComponentProps<"span">, "children">) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden",
        className
      )}
      {...props}
    />
  )
}
