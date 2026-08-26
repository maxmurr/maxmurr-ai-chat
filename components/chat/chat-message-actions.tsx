import { RefreshCwIcon } from "lucide-react"

import {
  ChatCopyButton,
  type ChatCopyResult,
} from "@/components/chat/chat-copy-button"
import { ChatTouchTarget } from "@/components/chat/chat-touch-target"
import { Button } from "@/components/ui/button"
import { MessageFooter } from "@/components/ui/message"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type ChatMessageActionsProps = {
  className?: string
  copyResult: ChatCopyResult
  isAssistant: boolean
  isGenerating: boolean
  messageId: string
  onCopyMessage: () => void
  onRetryMessage: (messageId: string) => void
}

/** Renders copy and retry actions for one chat message. */
export function ChatMessageActions({
  className,
  copyResult,
  isAssistant,
  isGenerating,
  messageId,
  onCopyMessage,
  onRetryMessage,
}: ChatMessageActionsProps) {
  return (
    <MessageFooter
      className={cn(
        "gap-0.5 px-0",
        !isAssistant &&
          "opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100 pointer-coarse:opacity-100",
        className
      )}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <ChatCopyButton
              aria-label="Copy message"
              copyResult={copyResult}
              onClick={onCopyMessage}
            />
          }
        />
        <TooltipContent>
          {copyResult === "copied"
            ? "Copied"
            : copyResult === "error"
              ? "Copy failed"
              : "Copy"}
        </TooltipContent>
      </Tooltip>
      {isAssistant && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Regenerate response"
                className="relative"
                disabled={isGenerating}
                onClick={() => onRetryMessage(messageId)}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <RefreshCwIcon />
                <ChatTouchTarget />
              </Button>
            }
          />
          <TooltipContent>Regenerate</TooltipContent>
        </Tooltip>
      )}
    </MessageFooter>
  )
}
