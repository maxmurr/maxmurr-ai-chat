import { useEffect, useRef, useState } from "react"

import { ChatComposerToolbar } from "@/features/chat/components/chat-composer-toolbar"
import { ChatSelectedAttachments } from "@/features/chat/components/chat-selected-attachments"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { LIBRARY_FILE_ACCEPT } from "@/src/entities/models/library"

type ChatFilePickerShortcut = Pick<
  KeyboardEvent,
  "ctrlKey" | "key" | "metaKey"
>

/** Returns whether keyboard event opens chat composer file picker. */
export function isChatFilePickerShortcut(event: ChatFilePickerShortcut) {
  return event.key.toLowerCase() === "u" && (event.metaKey || event.ctrlKey)
}

/** Message draft and selected files submitted by chat composer. */
export type ChatComposerSubmission = {
  readonly attachments: readonly File[]
  readonly text: string
}

/** Validates that chat composer has text or at least one attachment. */
export function validateChatComposerMessage(
  text: string,
  attachments: readonly File[]
) {
  if (!text.trim() && attachments.length === 0) {
    return "Enter a message or attach a file."
  }

  return undefined
}

type ChatComposerProps = {
  attachments: File[]
  className?: string
  draft: string
  isGenerating: boolean
  onAnnouncementChange: (announcement: string) => void
  onAttachmentsChange: (attachments: File[]) => void
  onDraftChange: (draft: string) => void
  onSendMessage: (submission: ChatComposerSubmission) => Promise<void>
  onStopResponse: () => void
}

/** Renders controlled chat draft and file attachment form. */
export function ChatComposer({
  attachments,
  className,
  draft,
  isGenerating,
  onAnnouncementChange,
  onAttachmentsChange,
  onDraftChange,
  onSendMessage,
  onStopResponse,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const error = hasAttemptedSubmit
    ? validateChatComposerMessage(draft, attachments)
    : undefined
  const canSend = !isGenerating && !validateChatComposerMessage(draft, attachments)

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

  return (
    <form
      className={cn(
        "relative z-10 w-full max-w-3xl shrink-0 px-4",
        className
      )}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setHasAttemptedSubmit(true)

        const messageText = draft.trim()
        if (
          isGenerating ||
          validateChatComposerMessage(messageText, attachments)
        ) {
          return
        }

        setHasAttemptedSubmit(false)
        onAnnouncementChange("")
        void onSendMessage({ attachments, text: messageText })
      }}
    >
      <div className="rounded-lg bg-background">
        <Input
          ref={fileInputRef}
          accept={LIBRARY_FILE_ACCEPT}
          aria-label="Choose files to attach"
          hidden
          multiple
          name="attachments"
          onChange={(event) => {
            onAttachmentsChange([
              ...attachments,
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
              <ChatSelectedAttachments
                files={attachments}
                onRemoveFile={(file) =>
                  onAttachmentsChange(
                    attachments.filter((currentFile) => currentFile !== file)
                  )
                }
              />
            </InputGroupAddon>
          )}

          {error && (
            <InputGroupAddon align="block-start" className="pb-0">
              <p
                className="text-sm text-destructive"
                id="chat-composer-message-error"
                role="alert"
              >
                {error}
              </p>
            </InputGroupAddon>
          )}

          <InputGroupTextarea
            aria-describedby={error ? "chat-composer-message-error" : undefined}
            aria-invalid={error !== undefined}
            aria-label="Message"
            autoComplete="off"
            className="min-h-0 px-4"
            data-1p-ignore
            data-lpignore="true"
            enterKeyHint="send"
            name="message"
            onChange={(event) => onDraftChange(event.currentTarget.value)}
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

          <ChatComposerToolbar
            canSend={canSend}
            isGenerating={isGenerating}
            onAnnouncementChange={onAnnouncementChange}
            onChooseFiles={() => fileInputRef.current?.click()}
            onStopResponse={onStopResponse}
          />
        </InputGroup>
      </div>
    </form>
  )
}
