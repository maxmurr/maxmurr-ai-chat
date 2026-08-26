"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Provider, useChat } from "@ai-sdk-tools/store"
import { code } from "@streamdown/code"
import { DefaultChatTransport } from "ai"
import {
  ArrowUpIcon,
  BookOpenIcon,
  BrainIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CopyIcon,
  FileTextIcon,
  FolderClosedIcon,
  GlobeIcon,
  LinkIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  RefreshCwIcon,
  TelescopeIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { Streamdown } from "streamdown"

import { useChatConversationTitle } from "@/components/chat/chat-conversation-title"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
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
import { Spinner } from "@/components/ui/spinner"
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
import { Switch } from "@/components/ui/switch"
import {
  convertChatUiMessageToDisplayMessage,
  type ChatDisplayMessage,
  type ChatDisplaySource,
  type ChatDisplayTool,
  type ChatUIMessage,
} from "@/lib/chat-ui-messages"
import { cn } from "@/lib/utils"

const CHAT_MODEL_LABEL = "Qwen 3.8 Max"
const CHAT_TRANSPORT = new DefaultChatTransport<ChatUIMessage>({
  api: "/api/chat",
})
const CHAT_MARKDOWN_PLUGINS = { code } as const

const CHAT_TOOL_STATE_METADATA = {
  running: {
    defaultOpen: true,
    label: "running",
    showLabel: false,
    statusClassName: "text-muted-foreground",
  },
  completed: {
    defaultOpen: false,
    label: "completed",
    showLabel: false,
    statusClassName: "text-muted-foreground",
  },
  failed: {
    defaultOpen: true,
    label: "failed",
    showLabel: true,
    statusClassName: "text-destructive",
  },
} as const satisfies Record<
  ChatDisplayTool["state"],
  {
    defaultOpen: boolean
    label: string
    showLabel: boolean
    statusClassName: string
  }
>

const CHAT_TOOL_STATE_ICONS = {
  running: Spinner,
  completed: CheckIcon,
  failed: TriangleAlertIcon,
} as const

type ChatCopyStatus = {
  messageId: string
  result: "copied" | "error"
} | null

type ChatFilePickerShortcut = Pick<
  KeyboardEvent,
  "ctrlKey" | "key" | "metaKey"
>

/** Returns whether keyboard event opens chat composer file picker. */
export function isChatFilePickerShortcut(event: ChatFilePickerShortcut) {
  return event.key.toLowerCase() === "u" && (event.metaKey || event.ctrlKey)
}

function ChatTouchTarget() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
    />
  )
}

function ChatMessageMarkdown({
  children,
  isAnimating = false,
}: {
  children: string
  isAnimating?: boolean
}) {
  return (
    <Streamdown
      caret="block"
      className="text-pretty max-sm:text-base"
      isAnimating={isAnimating}
      lineNumbers={false}
      plugins={CHAT_MARKDOWN_PLUGINS}
    >
      {children}
    </Streamdown>
  )
}

function ChatMessageReasoning({
  className,
  reasoning,
}: {
  className?: string
  reasoning: string
}) {
  const isLoading = reasoning.length === 0

  return (
    <Collapsible className={className} defaultOpen>
      <Marker
        aria-busy={isLoading}
        className="transition-colors hover:text-foreground"
        render={<CollapsibleTrigger />}
      >
        <MarkerIcon>
          {isLoading ? <Spinner /> : <BrainIcon />}
        </MarkerIcon>
        <MarkerContent
          className={cn(isLoading && "shimmer")}
          role={isLoading ? "status" : undefined}
        >
          {isLoading ? "Reasoning..." : "Reasoning"}
        </MarkerContent>
        <MarkerIcon>
          <ChevronDownIcon className="transition-transform group-aria-expanded/marker:rotate-180" />
        </MarkerIcon>
      </Marker>
      {!isLoading && (
        <CollapsibleContent>
          <Bubble className="mt-2" variant="muted">
            <BubbleContent className="text-muted-foreground">
              <ChatMessageMarkdown>{reasoning}</ChatMessageMarkdown>
            </BubbleContent>
          </Bubble>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

function ChatMessageSources({
  sources,
}: {
  sources: readonly ChatDisplaySource[]
}) {
  return (
    <Collapsible className="flex flex-col gap-1">
      <Marker
        className="w-fit rounded-sm py-1 text-base outline-none select-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm"
        render={<CollapsibleTrigger />}
      >
        <MarkerIcon>
          <BookOpenIcon />
        </MarkerIcon>
        <MarkerContent className="tabular-nums">
          {sources.length} sources
        </MarkerContent>
        <MarkerIcon>
          <ChevronDownIcon className="transition-transform group-aria-expanded/marker:rotate-180" />
        </MarkerIcon>
      </Marker>

      <CollapsibleContent>
        <ul className="flex flex-col gap-1" role="list">
          {sources.map((source) => (
            <li
              className="flex min-w-0 items-start gap-2 text-base/6 text-muted-foreground sm:text-sm/5"
              key={source.href ?? source.label}
            >
              {source.href ? (
                <LinkIcon className="size-5 shrink-0 sm:size-4" />
              ) : (
                <FileTextIcon className="size-5 shrink-0 sm:size-4" />
              )}
              {source.href ? (
                <a
                  className="min-w-0 rounded-sm text-foreground underline decoration-foreground/40 underline-offset-3 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  href={source.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {source.title}{" "}
                  <span className="text-muted-foreground">{source.label}</span>
                </a>
              ) : (
                <p className="min-w-0 text-pretty">
                  <span className="text-foreground">{source.title}</span>{" "}
                  {source.label}
                </p>
              )}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ChatMessageTool({ tool }: { tool: ChatDisplayTool }) {
  const [copyResult, setCopyResult] = useState<"copied" | "error" | null>(
    null
  )
  const stateMetadata = CHAT_TOOL_STATE_METADATA[tool.state]
  const StatusIcon = CHAT_TOOL_STATE_ICONS[tool.state]
  const formattedPayload = JSON.stringify(tool.payload, null, 2)
  const copyLabel =
    copyResult === "copied"
      ? `${tool.name} details copied`
      : copyResult === "error"
        ? `Could not copy ${tool.name} details`
        : `Copy ${tool.name} ${stateMetadata.label} details`

  async function copyChatToolDetails() {
    try {
      await navigator.clipboard.writeText(formattedPayload)
      setCopyResult("copied")
    } catch {
      setCopyResult("error")
    }
  }

  return (
    <Collapsible
      className="flex w-full min-w-0 flex-col gap-2"
      defaultOpen={stateMetadata.defaultOpen}
    >
      <Marker
        aria-busy={tool.state === "running" ? true : undefined}
        className={cn(
          "w-fit rounded-sm py-1 text-base outline-none select-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm",
          stateMetadata.statusClassName
        )}
        render={<CollapsibleTrigger />}
      >
        <MarkerIcon>
          <StatusIcon />
        </MarkerIcon>
        <MarkerContent
          className={cn(tool.state === "running" && "shimmer")}
        >
          {tool.name}
          <span className={cn(!stateMetadata.showLabel && "sr-only")}>
            {` · ${stateMetadata.label}`}
          </span>
        </MarkerContent>
        <MarkerIcon>
          <ChevronDownIcon className="transition-transform group-aria-expanded/marker:rotate-180" />
        </MarkerIcon>
      </Marker>

      <CollapsibleContent>
        <Card className="w-fit max-w-full" size="sm">
          <CardHeader className="border-b">
            <CardTitle>
              <code>{tool.name}</code>
            </CardTitle>
            <CardAction>
              <Button
                aria-label={copyLabel}
                className="relative"
                onClick={copyChatToolDetails}
                size="icon-sm"
                title={copyLabel}
                type="button"
                variant="ghost"
              >
                {copyResult === "copied" ? (
                  <CheckIcon />
                ) : copyResult === "error" ? (
                  <CircleAlertIcon />
                ) : (
                  <CopyIcon />
                )}
                <ChatTouchTarget />
              </Button>
              <span className="sr-only" role="status">
                {copyResult === "copied"
                  ? `${tool.name} details copied.`
                  : copyResult === "error"
                    ? `Could not copy ${tool.name} details.`
                    : ""}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent className="min-w-0">
            <pre className="max-w-full overflow-x-auto text-base/7 wrap-break-word whitespace-pre-wrap tabular-nums sm:text-sm/6">
              <code>{formattedPayload}</code>
            </pre>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Scopes optimized AI SDK chat state to current conversation. */
export function ChatThread() {
  return (
    <Provider<ChatUIMessage>>
      <ChatThreadContent />
    </Provider>
  )
}

function ChatThreadContent() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [composerAnnouncement, setComposerAnnouncement] = useState("")
  const [copyStatus, setCopyStatus] = useState<ChatCopyStatus>(null)
  const [draft, setDraft] = useState("")
  const [figmaConnected, setFigmaConnected] = useState(true)
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)
  const [researchModeEnabled, setResearchModeEnabled] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
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
  const canSend =
    !isGenerating && (draft.trim().length > 0 || attachments.length > 0)

  useEffect(() => {
    function openChatFilePickerFromShortcut(event: KeyboardEvent) {
      if (!isChatFilePickerShortcut(event)) {
        return
      }

      event.preventDefault()
      fileInputRef.current?.click()
    }

    document.addEventListener("keydown", openChatFilePickerFromShortcut)
    return () =>
      document.removeEventListener("keydown", openChatFilePickerFromShortcut)
  }, [])

  function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const messageText = draft.trim()

    if (isGenerating || (!messageText && attachments.length === 0)) {
      return
    }

    const nextMessageAttachments = attachments.map(({ name, type }) => ({
      filename: name,
      mediaType: type || "application/octet-stream",
    }))

    if (messages.length === 0) {
      setConversationTitle(
        messageText || nextMessageAttachments[0]?.filename || "New chat"
      )
    }

    clearError()
    setAttachments([])
    setComposerAnnouncement("")
    setDraft("")
    void sendMessage({
      text: messageText || "Attached files.",
      ...(nextMessageAttachments.length > 0
        ? { metadata: { attachments: nextMessageAttachments } }
        : {}),
    }).catch(() => setComposerAnnouncement("Could not send message."))
  }

  async function copyChatMessage(message: ChatDisplayMessage) {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopyStatus({ messageId: message.id, result: "copied" })
    } catch {
      setCopyStatus({ messageId: message.id, result: "error" })
    }
  }

  function retryChatMessage(messageId: string) {
    clearError()
    setComposerAnnouncement("")
    void regenerate({ messageId }).catch(() =>
      setComposerAnnouncement("Could not retry response.")
    )
  }

  const statusAnnouncement =
    composerAnnouncement ||
    (status === "submitted"
      ? "Message sent. Waiting for response."
      : status === "streaming"
        ? "Response streaming."
        : status === "error"
          ? "Could not generate response."
          : copyStatus?.result === "copied"
            ? "Response copied."
            : copyStatus?.result === "error"
              ? "Could not copy response."
              : "")

  return (
    <section
      aria-busy={isGenerating}
      aria-label="Chat conversation"
      className="flex min-h-0 flex-1 flex-col"
    >
      <h1 className="sr-only">{conversationTitle}</h1>

      <div className="flex size-full min-w-0 flex-col">
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
                      const isStreamingMessage =
                        status === "streaming" &&
                        isAssistant &&
                        chatMessages.at(-1)?.id === message.id
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
                              {message.reasoning !== undefined && (
                                <ChatMessageReasoning
                                  reasoning={message.reasoning}
                                />
                              )}

                              {message.tools && message.tools.length > 0 && (
                                <div className="flex w-full min-w-0 flex-col gap-4">
                                  {message.tools.map((tool) => (
                                    <ChatMessageTool key={tool.id} tool={tool} />
                                  ))}
                                </div>
                              )}

                              {message.attachments &&
                                message.attachments.length > 0 && (
                                  <AttachmentGroup>
                                    {message.attachments.map((attachment) => (
                                      <Attachment
                                        className="min-w-60"
                                        key={attachment.filename}
                                      >
                                        <AttachmentMedia>
                                          <FileTextIcon />
                                        </AttachmentMedia>
                                        <AttachmentContent>
                                          <AttachmentTitle>
                                            {attachment.filename}
                                          </AttachmentTitle>
                                          <AttachmentDescription>
                                            {attachment.mediaType}
                                          </AttachmentDescription>
                                        </AttachmentContent>
                                      </Attachment>
                                    ))}
                                  </AttachmentGroup>
                                )}

                              {message.content && (
                                <Bubble
                                  align={isAssistant ? "start" : "end"}
                                  variant={isAssistant ? "ghost" : "default"}
                                >
                                  <BubbleContent>
                                    <ChatMessageMarkdown
                                      isAnimating={isStreamingMessage}
                                    >
                                      {message.content}
                                    </ChatMessageMarkdown>
                                  </BubbleContent>
                                </Bubble>
                              )}

                              {message.sources &&
                                message.sources.length > 0 && (
                                  <ChatMessageSources
                                    sources={message.sources}
                                  />
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
                                    disabled={isGenerating}
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

                    {status === "submitted" && (
                      <MessageScrollerItem messageId="pending-response">
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
                    )}
                  </>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton className="data-[direction=end]:bottom-12" />
          </MessageScroller>
        </MessageScrollerProvider>

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
                          <FileTextIcon />
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
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <InputGroupButton
                        aria-label="Add attachments and tools"
                        className="relative -mr-1 shrink-0"
                        size="icon-sm"
                        title="Add attachments and tools"
                        type="button"
                      />
                    }
                  >
                    <PlusIcon />
                    <ChatTouchTarget />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-60"
                    side="top"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <PaperclipIcon />
                        Add files or photos
                        <DropdownMenuShortcut>⌘U</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Tools</DropdownMenuLabel>
                      <DropdownMenuCheckboxItem
                        checked={webSearchEnabled}
                        onCheckedChange={(checked) =>
                          setWebSearchEnabled(checked)
                        }
                        onSelect={(event) => event.preventDefault()}
                      >
                        <GlobeIcon />
                        Web search
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={researchModeEnabled}
                        onCheckedChange={(checked) =>
                          setResearchModeEnabled(checked)
                        }
                        onSelect={(event) => event.preventDefault()}
                      >
                        <TelescopeIcon />
                        Research mode
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Connectors</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          setComposerAnnouncement(
                            "Connector setup is not connected in this UI demo."
                          )
                        }
                      >
                        <PlusIcon />
                        Add connector
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setComposerAnnouncement(
                            "Connector management is not connected in this UI demo."
                          )
                        }
                      >
                        <FolderClosedIcon />
                        Manage connectors
                      </DropdownMenuItem>
                      <DropdownMenuCheckboxItem
                        checked={figmaConnected}
                        className="justify-between pr-1.5 *:data-[slot=dropdown-menu-checkbox-item-indicator]:hidden"
                        onCheckedChange={(checked) =>
                          setFigmaConnected(checked)
                        }
                        onSelect={(event) => event.preventDefault()}
                      >
                        <span className="flex items-center gap-1.5">
                          <Image
                            alt=""
                            className="shrink-0"
                            height={16}
                            src="/figma.svg"
                            width={16}
                          />
                          Figma
                        </span>
                        <Switch
                          aria-hidden="true"
                          checked={figmaConnected}
                          className="pointer-events-none"
                          size="sm"
                          tabIndex={-1}
                        />
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={googleDriveConnected}
                        className="justify-between pr-1.5 *:data-[slot=dropdown-menu-checkbox-item-indicator]:hidden"
                        onCheckedChange={(checked) =>
                          setGoogleDriveConnected(checked)
                        }
                        onSelect={(event) => event.preventDefault()}
                      >
                        <span className="flex items-center gap-1.5">
                          <Image
                            alt=""
                            className="shrink-0"
                            height={16}
                            src="/google-drive.svg"
                            width={16}
                          />
                          Google Drive
                        </span>
                        <Switch
                          aria-hidden="true"
                          checked={googleDriveConnected}
                          className="pointer-events-none"
                          size="sm"
                          tabIndex={-1}
                        />
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <span className="px-2 text-sm text-muted-foreground">
                  {CHAT_MODEL_LABEL}
                </span>

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
                  {isGenerating ? (
                    <InputGroupButton
                      aria-label="Stop response"
                      className="relative shrink-0"
                      onClick={() => void stop()}
                      size="icon-sm"
                      title="Stop response"
                      type="button"
                      variant="default"
                    >
                      <XIcon />
                      <ChatTouchTarget />
                    </InputGroupButton>
                  ) : (
                    <InputGroupButton
                      aria-label="Send message"
                      className="relative shrink-0"
                      disabled={!canSend}
                      size="icon-sm"
                      title={canSend ? "Send message" : "Enter a message"}
                      type="submit"
                      variant="default"
                    >
                      <ArrowUpIcon />
                      <ChatTouchTarget />
                    </InputGroupButton>
                  )}
                </div>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </form>

        <p className="shrink-0 px-4 py-2.5 text-center text-base/6 text-balance text-muted-foreground sm:text-xs/5">
          AI can make mistakes. Verify important information.
        </p>
      </div>

      <p className="sr-only" role="status">
        {statusAnnouncement}
      </p>
    </section>
  )
}
