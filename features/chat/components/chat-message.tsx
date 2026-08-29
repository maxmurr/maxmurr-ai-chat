import { FileTextIcon } from "lucide-react"

import type { ChatCopyResult } from "@/features/chat/components/chat-copy-button"
import { ChatMessageActions } from "@/features/chat/components/chat-message-actions"
import { ChatMessageMarkdown } from "@/features/chat/components/chat-message-markdown"
import { ChatMessageReasoning } from "@/features/chat/components/chat-message-reasoning"
import { ChatMessageSources } from "@/features/chat/components/chat-message-sources"
import { ChatMessageTool } from "@/features/chat/components/chat-message-tool"
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageContent } from "@/components/ui/message"
import { MessageScrollerItem } from "@/components/ui/message-scroller"
import {
  type ChatDisplayAttachment,
  type ChatDisplayMessage,
} from "@/src/interface-adapters/presenters/chat-message.presenter"
import { cn } from "@/lib/utils"

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
        <Attachment
          className="min-w-60"
          key={attachment.id}
          state={attachment.isAvailable ? "done" : "error"}
        >
          {attachment.href && (
            <AttachmentTrigger
              aria-label={`Download ${attachment.filename}`}
              render={<a download href={attachment.href} />}
            />
          )}
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{attachment.filename}</AttachmentTitle>
            <AttachmentDescription>
              {attachment.isAvailable
                ? attachment.mediaType
                : "File unavailable"}
            </AttachmentDescription>
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
  onRetryMessage?: (messageId: string) => void
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

          <ChatMessageActions
            copyResult={copyResult}
            isAssistant={isAssistant}
            isGenerating={isGenerating}
            messageId={message.id}
            onCopyMessage={onCopyMessage}
            onRetryMessage={onRetryMessage}
          />
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  )
}
