import { useState, useSyncExternalStore } from "react"
import type { ChatStatus } from "ai"
import { MessageCircleIcon } from "lucide-react"

import { ChatMessageItem } from "@/components/chat/chat-message"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Message, MessageContent } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Spinner } from "@/components/ui/spinner"
import type { ChatDisplayMessage } from "@/src/interface-adapters/presenters/chat-message.presenter"
import { cn } from "@/lib/utils"

const CHAT_SUGGESTIONS = [
  "Why is checkout throwing 500s?",
  "Review our pricing page",
  "Summarise this week's incidents",
] as const
const CHAT_GREETING_SUBSCRIBE = () => () => {}
const CHAT_GREETING_SERVER_SNAPSHOT = () => "Hello"

type ChatMessageCopyStatus = {
  messageId: string
  result: "copied" | "error"
} | null

/** Returns time-aware greeting shown in empty chat state. */
export function getChatGreeting(hour = new Date().getHours()) {
  return hour < 12
    ? "Good morning"
    : hour < 17
      ? "Good afternoon"
      : "Good evening"
}

function ChatEmptyMessageList({
  className,
  greeting,
  onSuggestionSelect,
}: {
  className?: string
  greeting: string
  onSuggestionSelect: (suggestion: string) => void
}) {
  return (
    <MessageScrollerItem
      className={cn("flex flex-1 items-center", className)}
      messageId="empty-chat"
    >
      <Empty className="w-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageCircleIcon />
          </EmptyMedia>
          <EmptyTitle>{greeting}, shadcn</EmptyTitle>
          <EmptyDescription>
            Ask a question, or start from one of these.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            {CHAT_SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                onClick={() => onSuggestionSelect(suggestion)}
                size="sm"
                type="button"
                variant="outline"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </EmptyContent>
      </Empty>
    </MessageScrollerItem>
  )
}

function ChatPendingResponse({ className }: { className?: string }) {
  return (
    <MessageScrollerItem
      className={cn(className)}
      messageId="pending-response"
    >
      <Message align="start">
        <MessageContent>
          <Marker aria-busy="true" className="w-fit">
            <MarkerIcon>
              <Spinner />
            </MarkerIcon>
            <MarkerContent className="shimmer" role="status">
              Thinking...
            </MarkerContent>
          </Marker>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  )
}

type ChatMessageListProps = {
  className?: string
  isGenerating: boolean
  messages: readonly ChatDisplayMessage[]
  onRetryMessage?: (messageId: string) => void
  onSuggestionSelect: (suggestion: string) => void
  status: ChatStatus
  streamingMessageId?: string
}

/** Renders empty, active, and pending states for current chat conversation. */
export function ChatMessageList({
  className,
  isGenerating,
  messages,
  onRetryMessage,
  onSuggestionSelect,
  status,
  streamingMessageId,
}: ChatMessageListProps) {
  const [copyStatus, setCopyStatus] = useState<ChatMessageCopyStatus>(null)
  const chatGreeting = useSyncExternalStore(
    CHAT_GREETING_SUBSCRIBE,
    getChatGreeting,
    CHAT_GREETING_SERVER_SNAPSHOT
  )

  async function copyChatMessage(message: ChatDisplayMessage) {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopyStatus({ messageId: message.id, result: "copied" })
    } catch {
      setCopyStatus({ messageId: message.id, result: "error" })
    }
  }

  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className={cn(className)}>
        <MessageScrollerViewport className="scroll-fade-b-20 focus-visible:outline-none">
          <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 pb-12">
            {messages.length === 0 ? (
              <ChatEmptyMessageList
                greeting={chatGreeting}
                onSuggestionSelect={onSuggestionSelect}
              />
            ) : (
              <>
                <MessageScrollerItem messageId="today-marker">
                  <Marker variant="separator">
                    <MarkerContent>Today</MarkerContent>
                  </Marker>
                </MessageScrollerItem>

                {messages.map((message) => (
                  <ChatMessageItem
                    copyResult={
                      copyStatus?.messageId === message.id
                        ? copyStatus.result
                        : null
                    }
                    isGenerating={isGenerating}
                    isStreaming={streamingMessageId === message.id}
                    key={message.id}
                    message={message}
                    onCopyMessage={() => void copyChatMessage(message)}
                    onRetryMessage={onRetryMessage}
                  />
                ))}

                {status === "submitted" && <ChatPendingResponse />}
              </>
            )}

            <span className="sr-only" role="status">
              {copyStatus?.result === "copied"
                ? "Response copied."
                : copyStatus?.result === "error"
                  ? "Could not copy response."
                  : ""}
            </span>
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton className="data-[direction=end]:bottom-12" />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}
