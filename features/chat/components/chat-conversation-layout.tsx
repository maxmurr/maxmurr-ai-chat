import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChatConversationLayoutProps = Omit<ComponentProps<"section">, "title"> & {
  statusAnnouncement?: ReactNode;
  title: ReactNode;
};

/** Provides accessible title, sizing, and status chrome for chat transcripts. */
export function ChatConversationLayout({
  children,
  className,
  statusAnnouncement,
  title,
  ...props
}: ChatConversationLayoutProps) {
  return (
    <section
      aria-label="Chat conversation"
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      {...props}
    >
      <h1 className="sr-only">{title}</h1>
      <div className="flex size-full min-w-0 flex-col">{children}</div>
      {statusAnnouncement !== undefined && (
        <p className="sr-only" role="status">
          {statusAnnouncement}
        </p>
      )}
    </section>
  );
}
