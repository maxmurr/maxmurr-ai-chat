import { useForm } from "@tanstack/react-form"
import { useEffect, useRef } from "react"

import { ChatComposerToolbar } from "@/components/chat/chat-composer-toolbar"
import { ChatSelectedAttachments } from "@/components/chat/chat-selected-attachments"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

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

type ChatComposerFormValues = {
  attachments: File[]
  message: {
    text: string
  }
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

/** Renders chat draft controls and owns composer-only interaction state. */
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
  const form = useForm({
    defaultValues: {
      attachments,
      message: {
        text: draft,
      },
    } satisfies ChatComposerFormValues,
    onSubmit: async ({ value }) => {
      const messageText = value.message.text.trim()

      if (isGenerating) {
        return
      }

      onAnnouncementChange("")
      await onSendMessage({
        attachments: value.attachments,
        text: messageText,
      })
    },
  })

  useEffect(() => {
    if (form.getFieldValue("message.text") !== draft) {
      form.setFieldValue("message.text", draft)
    }

    if (form.getFieldValue("attachments") !== attachments) {
      form.setFieldValue("attachments", attachments)
    }
  }, [attachments, draft, form])

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
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field mode="array" name="attachments">
        {(attachmentsField) => (
          <div className="rounded-lg bg-background">
            <input
              ref={fileInputRef}
              aria-label="Choose files to attach"
              hidden
              multiple
              name={attachmentsField.name}
              onChange={(event) => {
                const nextAttachments = [
                  ...attachmentsField.state.value,
                  ...Array.from(event.currentTarget.files ?? []),
                ]
                attachmentsField.handleChange(nextAttachments)
                onAttachmentsChange(nextAttachments)
                event.currentTarget.value = ""
              }}
              type="file"
            />

            <form.Field
              name="message.text"
              validators={{
                onChangeListenTo: ["attachments"],
                onChange: ({ value, fieldApi }) =>
                  validateChatComposerMessage(
                    value,
                    fieldApi.form.getFieldValue("attachments")
                  ),
              }}
            >
              {(messageField) => {
                const error = messageField.state.meta.errors.find(
                  (fieldError) => typeof fieldError === "string"
                )
                const errorId = "chat-composer-message-error"

                return (
                  <InputGroup>
                    {attachmentsField.state.value.length > 0 && (
                      <InputGroupAddon
                        align="block-start"
                        className="overflow-hidden pb-0"
                      >
                        <ChatSelectedAttachments
                          files={attachmentsField.state.value}
                          onRemoveFile={(file) => {
                            const nextAttachments =
                              attachmentsField.state.value.filter(
                                (currentFile) => currentFile !== file
                              )
                            attachmentsField.handleChange(nextAttachments)
                            onAttachmentsChange(nextAttachments)
                          }}
                        />
                      </InputGroupAddon>
                    )}

                    {error && (
                      <InputGroupAddon align="block-start" className="pb-0">
                        <p
                          className="text-sm text-destructive"
                          id={errorId}
                          role="alert"
                        >
                          {error}
                        </p>
                      </InputGroupAddon>
                    )}

                    <InputGroupTextarea
                      aria-describedby={error ? errorId : undefined}
                      aria-invalid={!messageField.state.meta.isValid}
                      aria-label="Message"
                      autoComplete="off"
                      className="min-h-0 px-4"
                      data-1p-ignore
                      data-lpignore="true"
                      enterKeyHint="send"
                      name={messageField.name}
                      onBlur={messageField.handleBlur}
                      onChange={(event) => {
                        messageField.handleChange(event.currentTarget.value)
                        onDraftChange(event.currentTarget.value)
                      }}
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
                      value={messageField.state.value}
                    />

                    <form.Subscribe
                      selector={(state) =>
                        !state.isSubmitting &&
                        (Boolean(state.values.message.text.trim()) ||
                          state.values.attachments.length > 0)
                      }
                    >
                      {(canSend) => (
                        <ChatComposerToolbar
                          canSend={canSend}
                          isGenerating={isGenerating}
                          onAnnouncementChange={onAnnouncementChange}
                          onChooseFiles={() => fileInputRef.current?.click()}
                          onStopResponse={onStopResponse}
                        />
                      )}
                    </form.Subscribe>
                  </InputGroup>
                )
              }}
            </form.Field>
          </div>
        )}
      </form.Field>
    </form>
  )
}
