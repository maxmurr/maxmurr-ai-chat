import type { ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Reserves five Chat list rows while a page or filter loads. */
export function ChatListRowsSkeleton({
  className,
  ...props
}: Omit<ComponentProps<"div">, "children">) {
  return (
    <div className={cn(className)} {...props}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          className="relative -mx-3 flex min-h-12 items-center gap-2 px-3 after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-border last:after:hidden"
          key={index}
        >
          <Skeleton className="h-5 w-2/3 max-w-sm min-w-0 motion-reduce:animate-none sm:h-4" />
          <Skeleton className="ml-auto h-5 w-14 shrink-0 motion-reduce:animate-none sm:h-4" />
          <Skeleton className="size-11 shrink-0 motion-reduce:animate-none pointer-fine:hidden" />
        </div>
      ))}
    </div>
  );
}
