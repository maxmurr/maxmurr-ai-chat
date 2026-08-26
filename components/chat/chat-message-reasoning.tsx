import { BrainIcon, ChevronDownIcon } from "lucide-react"

import { ChatMessageMarkdown } from "@/components/chat/chat-message-markdown"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Spinner } from "@/components/ui/spinner"
import type { ChatDisplayReasoning } from "@/src/interface-adapters/presenters/chat-message.presenter"
import { cn } from "@/lib/utils"

type ChatMessageReasoningProps = {
  className?: string
  reasoning: ChatDisplayReasoning
}

/** Renders expandable reasoning state for one assistant message. */
export function ChatMessageReasoning({
  className,
  reasoning,
}: ChatMessageReasoningProps) {
  const isRunning = reasoning.state === "running"

  return (
    <Collapsible
      className={cn("flex flex-col gap-2", className)}
      defaultOpen={isRunning}
      key={reasoning.state}
    >
      <Marker
        aria-busy={isRunning || undefined}
        className="transition-colors hover:text-foreground"
        render={<CollapsibleTrigger />}
      >
        <MarkerIcon>
          {isRunning ? <Spinner /> : <BrainIcon />}
        </MarkerIcon>
        <MarkerContent
          className={cn(isRunning && "shimmer")}
          role={isRunning ? "status" : undefined}
        >
          {isRunning ? "Reasoning..." : "Reasoning"}
        </MarkerContent>
        <MarkerIcon>
          <ChevronDownIcon className="transition-transform group-aria-expanded/marker:rotate-180" />
        </MarkerIcon>
      </Marker>
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
  )
}
