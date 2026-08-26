"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { CircleAlertIcon } from "lucide-react"

import {
  ChatComposer,
  type ChatComposerSubmission,
} from "@/components/chat/chat-composer"
import { useChatConversationTitle } from "@/components/chat/chat-conversation-title"
import { ChatMessageList } from "@/components/chat/chat-message-list"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  convertChatUiMessageToDisplayMessage,
  type ChatUIMessage,
} from "@/lib/chat-ui-messages"
import { cn } from "@/lib/utils"

const CHAT_TRANSPORT = new DefaultChatTransport<ChatUIMessage>({
  api: "/api/chat",
})

/** Renders current live chat conversation. */
export function ChatThread({ className }: { className?: string }) {
  return <ChatThreadContent className={className} />
}

function ChatThreadContent({ className }: { className?: string }) {
  const [attachments, setAttachments] = useState<File[]>([])
  const [composerAnnouncement, setComposerAnnouncement] = useState("")
  const [draft, setDraft] = useState("")
  const {
    clearError,
    error,
    messages: chatMessages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useChat<ChatUIMessage>({ transport: CHAT_TRANSPORT })
  const messages = chatMessages.flatMap((message) => {
    const displayMessage = convertChatUiMessageToDisplayMessage(message)
    return displayMessage ? [displayMessage] : []
  })
  const { conversationTitle, setConversationTitle } =
    useChatConversationTitle()
  const isGenerating = status === "submitted" || status === "streaming"
  const streamingMessageId =
    status === "streaming" ? chatMessages.at(-1)?.id : undefined

  async function sendChatMessage({
    attachments,
    text,
  }: ChatComposerSubmission) {
    if (isGenerating || (!text && attachments.length === 0)) {
      return
    }

    const messageAttachments = attachments.map(({ name, type }) => ({
      filename: name,
      mediaType: type || "application/octet-stream",
    }))

    if (messages.length === 0) {
      setConversationTitle(
        text || messageAttachments[0]?.filename || "New chat"
      )
    }

    clearError()
    setAttachments([])
    setDraft("")

    try {
      await sendMessage({
        text: text || "Attached files.",
        ...(messageAttachments.length > 0
          ? { metadata: { attachments: messageAttachments } }
          : {}),
      })
    } catch {
      setComposerAnnouncement("Could not send message.")
    }
  }

  function retryChatMessage(messageId: string) {
    clearError()
    setComposerAnnouncement("")
    void regenerate({ messageId }).catch(() =>
      setComposerAnnouncement("Could not retry response.")
    )
  }

  function submitSuggestedMessage(suggestion: string) {
    setComposerAnnouncement("")
    void sendChatMessage({ attachments, text: suggestion })
  }

  const statusAnnouncement =
    composerAnnouncement ||
    (status === "submitted"
      ? "Message sent. Waiting for response."
      : status === "streaming"
        ? "Response streaming."
        : status === "error"
          ? "Could not generate response."
          : "")

  return (
    <section
      aria-busy={isGenerating}
      aria-label="Chat conversation"
      className={cn("flex min-h-0 flex-1 flex-col", className)}
    >
      <h1 className="sr-only">{conversationTitle}</h1>

      <div className="flex size-full min-w-0 flex-col">
        <ChatMessageList
          className="-mb-8"
          isGenerating={isGenerating}
          messages={messages}
          onRetryMessage={retryChatMessage}
          onSuggestionSelect={submitSuggestedMessage}
          status={status}
          streamingMessageId={streamingMessageId}
        />

        {error && (
          <div className="mx-auto mb-2 w-full max-w-3xl px-4">
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Could not generate response</AlertTitle>
              <AlertDescription>
                Check model credentials, then send again or retry.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <ChatComposer
          attachments={attachments}
          className="mx-auto"
          draft={draft}
          isGenerating={isGenerating}
          onAnnouncementChange={setComposerAnnouncement}
          onAttachmentsChange={setAttachments}
          onDraftChange={setDraft}
          onSendMessage={sendChatMessage}
          onStopResponse={() => void stop()}
        />

        <p className="shrink-0 px-4 py-2.5 text-center text-xs text-balance text-muted-foreground">
          AI can make mistakes. Verify important information.
        </p>
      </div>

      <p className="sr-only" role="status">
        {statusAnnouncement}
      </p>
    </section>
  )
}
