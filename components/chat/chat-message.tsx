import { useState, type ComponentProps } from "react"
import { code } from "@streamdown/code"
import {
  BookOpenIcon,
  BrainIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CopyIcon,
  FileTextIcon,
  LinkIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Streamdown } from "streamdown"

import { ChatTouchTarget } from "@/components/chat/chat-touch-target"
import {
  Attachment,
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
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message"
import { MessageScrollerItem } from "@/components/ui/message-scroller"
import { Spinner } from "@/components/ui/spinner"
import {
  type ChatDisplayAttachment,
  type ChatDisplayMessage,
  type ChatDisplaySource,
  type ChatDisplayTool,
} from "@/lib/chat-ui-messages"
import { cn } from "@/lib/utils"

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

type ChatCopyResult = "copied" | "error" | null

type ChatCopyButtonProps = Omit<ComponentProps<typeof Button>, "children"> & {
  copyResult: ChatCopyResult
}

function ChatCopyButton({
  className,
  copyResult,
  ...props
}: ChatCopyButtonProps) {
  return (
    <Button
      className={cn("relative", className)}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
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
  )
}

function ChatMessageMarkdown({
  children,
  className,
  isAnimating = false,
}: {
  children: string
  className?: string
  isAnimating?: boolean
}) {
  return (
    <Streamdown
      caret="block"
      className={cn("text-pretty max-sm:text-base", className)}
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
    <Collapsible
      className={cn("flex flex-col gap-2", className)}
      defaultOpen
    >
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
          <Bubble variant="muted">
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
  className,
  sources,
}: {
  className?: string
  sources: readonly ChatDisplaySource[]
}) {
  return (
    <Collapsible className={cn("flex flex-col gap-1", className)}>
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

function ChatMessageTool({
  className,
  tool,
}: {
  className?: string
  tool: ChatDisplayTool
}) {
  const [copyResult, setCopyResult] = useState<ChatCopyResult>(null)
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
      className={cn("flex w-full min-w-0 flex-col gap-2", className)}
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
              <ChatCopyButton
                aria-label={copyLabel}
                copyResult={copyResult}
                onClick={copyChatToolDetails}
                title={copyLabel}
              />
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

function ChatMessageAttachments({
  attachments,
  className,
}: {
  attachments: readonly ChatDisplayAttachment[]
  className?: string
}) {
  return (
    <AttachmentGroup className={cn(className)}>
      {attachments.map((attachment) => (
        <Attachment className="min-w-60" key={attachment.filename}>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{attachment.filename}</AttachmentTitle>
            <AttachmentDescription>{attachment.mediaType}</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ))}
    </AttachmentGroup>
  )
}

type ChatMessageItemProps = {
  className?: string
  copyResult: ChatCopyResult
  isGenerating: boolean
  isStreaming: boolean
  message: ChatDisplayMessage
  onCopyMessage: () => void
  onRetryMessage: (messageId: string) => void
}

/** Renders one chat message with reasoning, tools, files, sources, and actions. */
export function ChatMessageItem({
  className,
  copyResult,
  isGenerating,
  isStreaming,
  message,
  onCopyMessage,
  onRetryMessage,
}: ChatMessageItemProps) {
  const isAssistant = message.role === "assistant"
  const copyLabel =
    copyResult === "copied"
      ? "Response copied"
      : copyResult === "error"
        ? "Copy response failed"
        : "Copy response"

  return (
    <MessageScrollerItem
      className={cn(className)}
      messageId={message.id}
      scrollAnchor={!isAssistant}
    >
      <Message align={isAssistant ? "start" : "end"}>
        <MessageContent>
          {message.reasoning !== undefined && (
            <ChatMessageReasoning reasoning={message.reasoning} />
          )}

          {message.tools && message.tools.length > 0 && (
            <div className="flex w-full min-w-0 flex-col gap-4">
              {message.tools.map((tool) => (
                <ChatMessageTool key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {message.attachments && message.attachments.length > 0 && (
            <ChatMessageAttachments attachments={message.attachments} />
          )}

          {message.content && (
            <Bubble
              align={isAssistant ? "start" : "end"}
              variant={isAssistant ? "ghost" : "default"}
            >
              <BubbleContent>
                <ChatMessageMarkdown
                  isAnimating={isAssistant && isStreaming}
                >
                  {message.content}
                </ChatMessageMarkdown>
              </BubbleContent>
            </Bubble>
          )}

          {message.sources && message.sources.length > 0 && (
            <ChatMessageSources sources={message.sources} />
          )}

          <MessageFooter
            className={cn(
              "gap-0.5",
              !isAssistant &&
              "opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100 pointer-coarse:opacity-100"
            )}
          >
            <ChatCopyButton
              aria-label={copyLabel}
              copyResult={copyResult}
              onClick={onCopyMessage}
              title={copyLabel}
            />
            {isAssistant && (
              <Button
                aria-label="Retry response"
                className="relative"
                disabled={isGenerating}
                onClick={() => onRetryMessage(message.id)}
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
}
