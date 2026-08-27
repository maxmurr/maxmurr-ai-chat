"use client"

import { ChatMessageList } from "@/components/chat/chat-message-list"
import {
  convertChatUiMessageToDisplayMessage,
  type ChatUIMessage,
} from "@/src/interface-adapters/presenters/chat-message.presenter"
import { cn } from "@/lib/utils"

/** Renders a finished conversation for viewers who cannot write to it. */
export function ChatTranscript({
  className,
  messages,
  title,
}: {
  className?: string
  messages: ChatUIMessage[]
  title: string
}) {
  const displayMessages = messages.flatMap((message) => {
    const displayMessage = convertChatUiMessageToDisplayMessage(message)
    return displayMessage ? [displayMessage] : []
  })

  return (
    <section
      aria-label="Chat conversation"
      className={cn("flex min-h-0 flex-1 flex-col", className)}
    >
      <h1 className="sr-only">{title}</h1>

      <div className="flex size-full min-w-0 flex-col">
        <ChatMessageList
          isGenerating={false}
          messages={displayMessages}
          onSuggestionSelect={() => {}}
          status="ready"
        />

        <p className="shrink-0 px-4 py-2.5 text-center text-xs text-balance text-muted-foreground">
          This chat is read-only.
        </p>
      </div>
    </section>
  )
}
