import type { ComponentProps } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ChatActivityState = {
  activeStreamId: string | null;
  hasUnreadResponse: boolean;
};

type ChatActivityIndicatorProps = Omit<ComponentProps<"span">, "children"> &
  ChatActivityState;

/** Returns the accessible label suffix for a Chat response state. */
export function getChatActivityAriaSuffix({
  activeStreamId,
  hasUnreadResponse,
}: ChatActivityState) {
  if (activeStreamId !== null) return ", generating response";
  if (hasUnreadResponse) return ", unread response";
  return "";
}

/** Renders the shared generating or unread Chat activity marker. */
export function ChatActivityIndicator({
  activeStreamId,
  className,
  hasUnreadResponse,
  ...props
}: ChatActivityIndicatorProps) {
  const isGeneratingResponse = activeStreamId !== null;

  if (!isGeneratingResponse && !hasUnreadResponse) return null;

  return (
    <span
      {...props}
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center",
        className
      )}
      data-slot="chat-conversation-activity"
    >
      {isGeneratingResponse ? (
        <Spinner className="text-muted-foreground motion-reduce:animate-none" />
      ) : (
        <span
          className="size-2 rounded-full bg-status-unread"
          data-slot="chat-unread-indicator"
        />
      )}
    </span>
  );
}
