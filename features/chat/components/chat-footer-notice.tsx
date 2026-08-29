import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Renders the compact status notice below every Chat composer or transcript. */
export function ChatFooterNotice({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "shrink-0 px-4 py-2.5 text-center text-xs text-balance text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
