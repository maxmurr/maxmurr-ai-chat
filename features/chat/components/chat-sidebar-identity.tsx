import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChatSidebarIdentityProps = {
  className?: string;
  description?: ReactNode;
  title: ReactNode;
};

/** Renders shared title and description layout for chat sidebar identities. */
export function ChatSidebarIdentity({
  className,
  description,
  title,
}: ChatSidebarIdentityProps) {
  return (
    <div className={cn("grid min-w-0 flex-1 text-left", className)}>
      <div className="truncate font-medium">{title}</div>
      {description ? (
        <div className="truncate text-base lg:text-xs">{description}</div>
      ) : null}
    </div>
  );
}
