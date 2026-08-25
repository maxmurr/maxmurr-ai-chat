"use client"

import { useRef, useState, type FormEvent } from "react"
import {
  ArrowUpIcon,
  BrainIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CopyIcon,
  FileIcon,
  MicIcon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react"

import { useChatConversationTitle } from "@/components/chat/chat-conversation-title"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import {
  buildMockChatMessages,
  type MockChatMessage,
} from "@/lib/mock-chat-conversations"

const CHAT_MODEL_OPTIONS = ["Grok Build 0.1", "UI Demo"] as const

type ChatCopyStatus = {
  messageId: string
  result: "copied" | "error"
} | null

function ChatTouchTarget() {
  return (
    <span
      aria-hidden="true"
      className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
    />
  )
}

function ChatDemoIntroduction() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-pretty max-sm:text-base">
        This thread is scripted with{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          @shadcn/helpers/ai-sdk
        </code>
        , so nothing is being sent to a model.
      </p>
      <p className="text-pretty max-sm:text-base">
        Set{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          AI_GATEWAY_API_KEY
        </code>{" "}
        and the same request reaches a real model instead. Nothing in the UI
        changes.
      </p>
    </div>
  )
}

function ChatMessageReasoning({ reasoning }: { reasoning: string }) {
  return (
    <Collapsible defaultOpen>
      <Marker
        className="transition-colors hover:text-foreground"
        render={<CollapsibleTrigger />}
      >
        <MarkerIcon>
          <BrainIcon />
        </MarkerIcon>
        <MarkerContent>Reasoning</MarkerContent>
        <MarkerIcon>
          <ChevronDownIcon className="transition-transform group-aria-expanded/marker:rotate-180" />
        </MarkerIcon>
      </Marker>
      <CollapsibleContent>
        <Bubble className="mt-2" variant="muted">
          <BubbleContent className="whitespace-pre-wrap text-muted-foreground">
            {reasoning}
          </BubbleContent>
        </Bubble>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Renders local chat messages, attachment controls, and composer interactions. */
export function ChatThread({
  initialConversationTitle,
}: {
  initialConversationTitle?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [composerAnnouncement, setComposerAnnouncement] = useState("")
  const [copyStatus, setCopyStatus] = useState<ChatCopyStatus>(null)
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<MockChatMessage[]>(() =>
    buildMockChatMessages(initialConversationTitle)
  )
  const [selectedModel, setSelectedModel] =
    useState<(typeof CHAT_MODEL_OPTIONS)[number]>(CHAT_MODEL_OPTIONS[0])
  const { conversationTitle, setConversationTitle } =
    useChatConversationTitle()
  const canSend = draft.trim().length > 0 || attachments.length > 0

  function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const messageText = draft.trim()

    if (!messageText && attachments.length === 0) {
      return
    }

    const attachmentNames = attachments.map(({ name }) => name)
    const nextMessage: MockChatMessage = {
      attachments: attachmentNames,
      content: [messageText || "Attached files."],
      id: crypto.randomUUID(),
      role: "user",
    }

    if (messages.length === 0) {
      setConversationTitle(messageText || attachmentNames[0])
    }

    setMessages((currentMessages) => [...currentMessages, nextMessage])
    setAttachments([])
    setComposerAnnouncement("")
    setDraft("")
  }

  async function copyChatMessage(message: MockChatMessage) {
    try {
      await navigator.clipboard.writeText(message.content.join("\n\n"))
      setCopyStatus({ messageId: message.id, result: "copied" })
    } catch {
      setCopyStatus({ messageId: message.id, result: "error" })
    }
  }

  function retryChatMessage(messageId: string) {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId && message.role === "assistant"
          ? {
              ...message,
              content: [
                "Response refreshed locally. No model is connected.",
                "Connect an AI SDK route to retry against a real model.",
              ],
              presentation: undefined,
              reasoning:
                "No model is connected, so this retry used the local demo response.",
            }
          : message
      )
    )
    setComposerAnnouncement("Response refreshed locally.")
  }

  const statusAnnouncement =
    composerAnnouncement ||
    (copyStatus?.result === "copied"
      ? "Response copied."
      : copyStatus?.result === "error"
        ? "Could not copy response."
        : "")

  return (
    <section
      aria-label="Chat conversation"
      className="flex min-h-0 flex-1 flex-col"
    >
      <h1 className="sr-only">{conversationTitle}</h1>

      <div className="flex h-full w-full min-w-0 flex-col">
        <MessageScrollerProvider autoScroll>
          <MessageScroller className="-mb-8">
            <MessageScrollerViewport>
              <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 pb-12">
                {messages.length === 0 ? (
                  <MessageScrollerItem
                    className="flex flex-1"
                    messageId="empty-chat"
                  >
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>How can I help?</EmptyTitle>
                        <EmptyDescription>
                          Ask a question or attach files to start a conversation.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </MessageScrollerItem>
                ) : (
                  <>
                    <MessageScrollerItem messageId="today-marker">
                      <Marker variant="separator">
                        <MarkerContent>Today</MarkerContent>
                      </Marker>
                    </MessageScrollerItem>

                    {messages.map((message) => {
                      const isAssistant = message.role === "assistant"
                      const isCopied =
                        copyStatus?.messageId === message.id &&
                        copyStatus.result === "copied"
                      const copyFailed =
                        copyStatus?.messageId === message.id &&
                        copyStatus.result === "error"
                      const copyLabel = isCopied
                        ? "Response copied"
                        : copyFailed
                          ? "Copy response failed"
                          : "Copy response"

                      return (
                        <MessageScrollerItem
                          key={message.id}
                          messageId={message.id}
                          scrollAnchor={!isAssistant}
                        >
                          <Message align={isAssistant ? "start" : "end"}>
                            <MessageContent>
                              {message.reasoning && (
                                <ChatMessageReasoning
                                  reasoning={message.reasoning}
                                />
                              )}

                              <Bubble
                                align={isAssistant ? "start" : "end"}
                                variant={isAssistant ? "ghost" : "default"}
                              >
                                <BubbleContent>
                                  {message.presentation === "demo-intro" ? (
                                    <ChatDemoIntroduction />
                                  ) : (
                                    <div className="flex flex-col gap-4">
                                      {message.content.map((paragraph) => (
                                        <p
                                          className="text-pretty max-sm:text-base"
                                          key={paragraph}
                                        >
                                          {paragraph}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </BubbleContent>
                              </Bubble>

                              {message.attachments &&
                                message.attachments.length > 0 && (
                                  <AttachmentGroup>
                                    {message.attachments.map((filename) => (
                                      <Attachment key={filename} size="xs">
                                        <AttachmentMedia>
                                          <FileIcon />
                                        </AttachmentMedia>
                                        <AttachmentContent>
                                          <AttachmentTitle>
                                            {filename}
                                          </AttachmentTitle>
                                        </AttachmentContent>
                                      </Attachment>
                                    ))}
                                  </AttachmentGroup>
                                )}

                              <MessageFooter
                                className={
                                  isAssistant
                                    ? "gap-0.5"
                                    : "gap-0.5 opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100 pointer-coarse:opacity-100"
                                }
                              >
                                <Button
                                  aria-label={copyLabel}
                                  className="relative"
                                  onClick={() => copyChatMessage(message)}
                                  size="icon-sm"
                                  title={copyLabel}
                                  type="button"
                                  variant="ghost"
                                >
                                  {isCopied ? (
                                    <CheckIcon />
                                  ) : copyFailed ? (
                                    <CircleAlertIcon />
                                  ) : (
                                    <CopyIcon />
                                  )}
                                  <ChatTouchTarget />
                                </Button>
                                {isAssistant && (
                                  <Button
                                    aria-label="Retry response"
                                    className="relative"
                                    onClick={() => retryChatMessage(message.id)}
                                    size="icon-sm"
                                    title="Retry response"
                                    type="button"
                                    variant="ghost"
                                  >
                                    <RefreshCwIcon />
                                    <ChatTouchTarget />
                                  </Button>
                                )}
                              </MessageFooter>
                            </MessageContent>
                          </Message>
                        </MessageScrollerItem>
                      )
                    })}
                  </>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton className="data-[direction=end]:bottom-12" />
          </MessageScroller>
        </MessageScrollerProvider>

        <form
          className="relative z-10 mx-auto w-full max-w-3xl shrink-0 px-4"
          onSubmit={sendChatMessage}
        >
          <div className="rounded-lg bg-background">
            <input
              ref={fileInputRef}
              aria-label="Choose files to attach"
              hidden
              multiple
              name="attachments"
              onChange={(event) => {
                setAttachments((currentAttachments) => [
                  ...currentAttachments,
                  ...Array.from(event.currentTarget.files ?? []),
                ])
                event.currentTarget.value = ""
              }}
              type="file"
            />

            <InputGroup>
              {attachments.length > 0 && (
                <InputGroupAddon
                  align="block-start"
                  className="overflow-hidden pb-0"
                >
                  <AttachmentGroup className="w-full">
                    {attachments.map((file) => (
                      <Attachment
                        key={`${file.name}-${file.lastModified}`}
                        size="xs"
                      >
                        <AttachmentMedia>
                          <FileIcon />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>{file.name}</AttachmentTitle>
                        </AttachmentContent>
                        <AttachmentActions>
                          <AttachmentAction
                            aria-label={`Remove ${file.name}`}
                            className="relative"
                            onClick={() =>
                              setAttachments((currentAttachments) =>
                                currentAttachments.filter(
                                  (currentFile) => currentFile !== file
                                )
                              )
                            }
                            title={`Remove ${file.name}`}
                            type="button"
                          >
                            <XIcon />
                            <ChatTouchTarget />
                          </AttachmentAction>
                        </AttachmentActions>
                      </Attachment>
                    ))}
                  </AttachmentGroup>
                </InputGroupAddon>
              )}

              <InputGroupTextarea
                aria-label="Message"
                autoComplete="off"
                className="min-h-0 px-4"
                data-1p-ignore
                data-lpignore="true"
                enterKeyHint="send"
                name="message"
                onChange={(event) => setDraft(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
                placeholder="Ask anything..."
                value={draft}
              />

              <InputGroupAddon
                align="block-end"
                className="gap-1 p-2 pt-0"
              >
                <InputGroupButton
                  aria-label="Add attachments and tools"
                  className="relative -mr-1 shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  size="icon-sm"
                  title="Add attachments and tools"
                  type="button"
                >
                  <PlusIcon />
                  <ChatTouchTarget />
                </InputGroupButton>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <InputGroupButton
                        className="min-w-0 gap-1 px-2"
                        size="sm"
                        type="button"
                      />
                    }
                  >
                    <span className="truncate text-foreground">
                      {selectedModel}
                    </span>
                    <ChevronDownIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="min-w-48"
                    side="top"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuRadioGroup
                        onValueChange={(value) =>
                          setSelectedModel(
                            value as (typeof CHAT_MODEL_OPTIONS)[number]
                          )
                        }
                        value={selectedModel}
                      >
                        {CHAT_MODEL_OPTIONS.map((model) => (
                          <DropdownMenuRadioItem key={model} value={model}>
                            {model}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex flex-1 justify-end gap-1">
                  <InputGroupButton
                    aria-label="Dictate"
                    className="relative shrink-0"
                    onClick={() =>
                      setComposerAnnouncement(
                        "Dictation is not connected in this UI demo."
                      )
                    }
                    size="icon-sm"
                    title="Dictate"
                    type="button"
                  >
                    <MicIcon />
                    <ChatTouchTarget />
                  </InputGroupButton>
                  <InputGroupButton
                    aria-disabled={!canSend}
                    aria-label="Send message"
                    className="relative shrink-0"
                    size="icon-sm"
                    title={canSend ? "Send message" : "Enter a message"}
                    type="submit"
                    variant="default"
                  >
                    <ArrowUpIcon />
                    <ChatTouchTarget />
                  </InputGroupButton>
                </div>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </form>

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
