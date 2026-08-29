import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Keeps authenticated index-page content at one responsive width and padding. */
export function AppPageContainer({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("@container w-full max-w-7xl p-4 lg:p-6", className)}
      {...props}
    />
  );
}
