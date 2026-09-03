"use client";

import { useState } from "react";
import { FileTextIcon } from "lucide-react";

import type { ChatCopyResult } from "@/features/chat/components/chat-copy-button";
import { ChatMessageActions } from "@/features/chat/components/chat-message-actions";
import { ChatMessageMarkdown } from "@/features/chat/components/chat-message-markdown";
import { ChatMessageReasoning } from "@/features/chat/components/chat-message-reasoning";
import { ChatMessageSources } from "@/features/chat/components/chat-message-sources";
import { ChatMessageTool } from "@/features/chat/components/chat-message-tool";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Message, MessageContent } from "@/components/ui/message";
import { MessageScrollerItem } from "@/components/ui/message-scroller";
import {
  type ChatDisplayAttachment,
  type ChatDisplayMessage,
} from "@/src/interface-adapters/presenters/chat-message.presenter";
import { cn } from "@/lib/utils";

function ChatMessageAttachments({
  attachments,
  className,
}: {
  attachments: readonly ChatDisplayAttachment[];
  className?: string;
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
  );
}

function ChatMessageEditor({
  content,
  isGenerating,
  onCancel,
  onSave,
}: {
  content: string;
  isGenerating: boolean;
  onCancel: () => void;
  onSave: (content: string) => void;
}) {
  const [draft, setDraft] = useState(content);
  const editedContent = draft.trim();
  const canSave =
    !isGenerating &&
    editedContent.length > 0 &&
    editedContent !== content.trim();

  return (
    <Bubble align="end" className="w-full max-w-[80%]" variant="ghost">
      <BubbleContent className="w-full">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) onSave(editedContent);
          }}
        >
          <InputGroup>
            <InputGroupTextarea
              aria-label="Edit message"
              autoComplete="off"
              autoFocus
              className="min-h-24"
              data-1p-ignore
              data-lpignore="true"
              enterKeyHint="send"
              name="edited-message"
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancel();
                } else if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              value={draft}
            />
            <InputGroupAddon align="block-end" className="justify-end">
              <Button
                onClick={onCancel}
                size="touch-sm"
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button disabled={!canSave} size="touch-sm" type="submit">
                Send
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </BubbleContent>
    </Bubble>
  );
}

type ChatMessageItemProps = {
  className?: string;
  copyResult: ChatCopyResult;
  feedbackChatId?: string;
  isGenerating: boolean;
  isStreaming: boolean;
  message: ChatDisplayMessage;
  onCopyMessage: () => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onRetryMessage?: (messageId: string) => void;
};

/** Renders one chat message with reasoning, tools, files, sources, and actions. */
export function ChatMessageItem({
  className,
  copyResult,
  feedbackChatId,
  isGenerating,
  isStreaming,
  message,
  onCopyMessage,
  onEditMessage,
  onRetryMessage,
}: ChatMessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isAssistant = message.role === "assistant";

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

          {message.content &&
            (isEditing ? (
              <ChatMessageEditor
                content={message.content}
                isGenerating={isGenerating}
                onCancel={() => setIsEditing(false)}
                onSave={(content) => {
                  setIsEditing(false);
                  onEditMessage?.(message.id, content);
                }}
              />
            ) : (
              <Bubble
                align={isAssistant ? "start" : "end"}
                variant={isAssistant ? "ghost" : "default"}
              >
                <BubbleContent>
                  <ChatMessageMarkdown isAnimating={isAssistant && isStreaming}>
                    {message.content}
                  </ChatMessageMarkdown>
                </BubbleContent>
              </Bubble>
            ))}

          {message.sources && message.sources.length > 0 && (
            <ChatMessageSources sources={message.sources} />
          )}

          {!isEditing && (
            <ChatMessageActions
              copyResult={copyResult}
              feedbackChatId={feedbackChatId}
              feedbackEnabled={message.feedbackEnabled === true}
              isAssistant={isAssistant}
              isGenerating={isGenerating}
              messageId={message.id}
              onCopyMessage={onCopyMessage}
              onEditMessage={
                message.content && onEditMessage
                  ? () => setIsEditing(true)
                  : undefined
              }
              onRetryMessage={onRetryMessage}
            />
          )}
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}
