import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Provides shared flex sizing for authenticated route content. */
export function AppRouteShell({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)} {...props} />
  );
}
