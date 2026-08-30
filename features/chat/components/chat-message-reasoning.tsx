import { BrainIcon } from "lucide-react";

import { ChatMessageDisclosureTrigger } from "@/features/chat/components/chat-message-disclosure-trigger";
import { ChatMessageMarkdown } from "@/features/chat/components/chat-message-markdown";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import type { ChatDisplayReasoning } from "@/src/interface-adapters/presenters/chat-message.presenter";
import { cn } from "@/lib/utils";

type ChatMessageReasoningProps = {
  className?: string;
  reasoning: ChatDisplayReasoning;
};

/** Renders expandable reasoning state for one assistant message. */
export function ChatMessageReasoning({
  className,
  reasoning,
}: ChatMessageReasoningProps) {
  const isRunning = reasoning.state === "running";

  return (
    <Collapsible
      className={cn("flex flex-col gap-2", className)}
      defaultOpen={isRunning}
      key={reasoning.state}
    >
      <ChatMessageDisclosureTrigger
        aria-busy={isRunning || undefined}
        className="transition-colors hover:text-foreground"
        contentClassName={cn(isRunning && "shimmer")}
        contentProps={{ role: isRunning ? "status" : undefined }}
        icon={isRunning ? <Spinner /> : <BrainIcon />}
        label={isRunning ? "Reasoning..." : "Reasoning"}
      />
      {reasoning.text && (
        <CollapsibleContent>
          <Bubble variant="muted">
            <BubbleContent className="text-muted-foreground">
              <ChatMessageMarkdown>{reasoning.text}</ChatMessageMarkdown>
            </BubbleContent>
          </Bubble>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
