"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type FileUIPart } from "ai"
import { CircleAlertIcon } from "lucide-react"

import {
  ChatComposer,
  type ChatComposerSubmission,
} from "@/components/chat/chat-composer"
import { useChatConversationTitle } from "@/components/chat/chat-conversation-title"
import { ChatMessageList } from "@/components/chat/chat-message-list"
import { uploadLibraryFiles } from "@/components/library/upload-library-files"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  convertChatUiMessageToDisplayMessage,
  type ChatUIMessage,
} from "@/src/interface-adapters/presenters/chat-message.presenter"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { createLibraryFileDownloadUrl } from "@/src/entities/models/library"

const CHAT_TRANSPORT = new DefaultChatTransport<ChatUIMessage>({
  api: "/api/chat",
  // The server owns chat history; each request carries only the new turn.
  prepareSendMessagesRequest: ({ id, messageId, messages, trigger }) => ({
    body: { id, message: messages.at(-1), messageId, trigger },
  }),
})

type ChatThreadProps = {
  chatId: string
  className?: string
  initialMessages?: ChatUIMessage[]
}

/** Renders current live chat conversation. */
export function ChatThread({
  chatId,
  className,
  initialMessages,
}: ChatThreadProps) {
  return (
    <ChatThreadContent
      chatId={chatId}
      className={className}
      initialMessages={initialMessages}
    />
  )
}

function ChatThreadContent({
  chatId,
  className,
  initialMessages,
}: ChatThreadProps) {
  const router = useRouter()
  const isNewlyPersistedChatRef = useRef(false)
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
  } = useChat<ChatUIMessage>({
    id: chatId,
    messages: initialMessages,
    onFinish: () => {
      // Refresh once after the first exchange so the sidebar picks up the chat.
      if (isNewlyPersistedChatRef.current) {
        isNewlyPersistedChatRef.current = false
        router.refresh()
      }
    },
    transport: CHAT_TRANSPORT,
  })
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

    clearError()
    setComposerAnnouncement("")

    try {
      const uploadedFiles =
        attachments.length > 0 ? await uploadLibraryFiles(attachments) : []
      const fileParts: FileUIPart[] = uploadedFiles.map((file) => ({
        filename: file.name,
        mediaType: file.mediaType,
        type: "file",
        url: createLibraryFileDownloadUrl(file.id),
      }))
      const messageId = crypto.randomUUID()

      if (messages.length === 0) {
        setConversationTitle(text || uploadedFiles[0]?.name || "New chat")
        isNewlyPersistedChatRef.current = true
        window.history.replaceState(null, "", `/chat/${chatId}`)
      }

      setAttachments([])
      setDraft("")

      await sendMessage({
        id: messageId,
        metadata: { createdAt: new Date().toISOString() },
        parts: [
          ...fileParts,
          ...(text ? [{ text, type: "text" as const }] : []),
        ],
        role: "user",
      })
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Could not send message."
      setComposerAnnouncement(description)
      toast.add({
        description,
        title: attachments.length > 0 ? "File send failed" : "Message failed",
        type: "error",
      })
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
