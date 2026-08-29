"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  useMessageScroller,
  useMessageScrollerVisibility,
} from "@/components/ui/message-scroller";
import type { ChatDisplayMessage } from "@/src/interface-adapters/presenters/chat-message.presenter";
import { cn } from "@/lib/utils";

/** Tracks current user prompt and jumps between prompts in one conversation. */
export function ChatPromptNavigation({
  messages,
}: {
  messages: readonly ChatDisplayMessage[];
}) {
  const hoverCardActionsRef = useRef<{
    close(): void;
    unmount(): void;
  }>(null);
  const { scrollToMessage } = useMessageScroller();
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility();
  const prompts = messages
    .filter((message) => message.role === "user")
    .map((message) => ({
      id: message.id,
      label:
        message.content.trim() ||
        message.attachments?.map(({ filename }) => filename).join(", ") ||
        "Prompt",
    }));
  const currentPromptId =
    prompts.find(({ id }) => id === currentAnchorId)?.id ??
    prompts.find(({ id }) => visibleMessageIds.includes(id))?.id ??
    prompts[0]?.id;

  if (prompts.length < 2) {
    return null;
  }

  function navigateToPrompt(promptId: string) {
    hoverCardActionsRef.current?.close();
    scrollToMessage(promptId, {
      align: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  return (
    <HoverCard actionsRef={hoverCardActionsRef}>
      <nav
        aria-label="Prompt navigation"
        className="absolute inset-y-0 end-1 hidden items-center lg:pointer-fine:flex"
      >
        <ol className="flex flex-col items-end gap-0.5" role="list">
          {prompts.map((prompt, index) => {
            const isCurrent = prompt.id === currentPromptId;

            return (
              <li className="flex" key={prompt.id}>
                <HoverCardTrigger
                  closeDelay={150}
                  delay={200}
                  render={
                    <button
                      aria-current={isCurrent ? "location" : undefined}
                      aria-label={`Prompt ${index + 1}: ${prompt.label}`}
                      className="group/prompt flex h-3 w-8 items-center justify-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      onClick={() => navigateToPrompt(prompt.id)}
                      type="button"
                    />
                  }
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-0.5 w-3 rounded-full bg-muted-foreground/40 group-hover/prompt:w-4 group-hover/prompt:bg-muted-foreground group-focus-visible/prompt:w-4 group-focus-visible/prompt:bg-muted-foreground",
                      isCurrent && "w-5 bg-foreground"
                    )}
                  />
                </HoverCardTrigger>
              </li>
            );
          })}
        </ol>
      </nav>

      <HoverCardContent
        align="center"
        className="max-h-[min(70dvh,32rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto motion-reduce:animate-none motion-reduce:duration-0"
        side="inline-start"
        sideOffset={8}
      >
        <nav aria-label="All prompts">
          <ol className="flex flex-col gap-0.5" role="list">
            {prompts.map((prompt) => {
              const isCurrent = prompt.id === currentPromptId;

              return (
                <li key={prompt.id}>
                  <Button
                    aria-current={isCurrent ? "location" : undefined}
                    className="h-auto min-h-9 w-full min-w-0 justify-start py-2 text-left whitespace-normal"
                    onClick={() => navigateToPrompt(prompt.id)}
                    size="sm"
                    title={prompt.label}
                    type="button"
                    variant={isCurrent ? "secondary" : "ghost"}
                  >
                    <span className="line-clamp-2 min-w-0 text-pretty">
                      {prompt.label}
                    </span>
                  </Button>
                </li>
              );
            })}
          </ol>
        </nav>
      </HoverCardContent>
    </HoverCard>
  );
}
