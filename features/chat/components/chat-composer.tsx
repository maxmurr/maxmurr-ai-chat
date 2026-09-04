"use client";

import { useEffect, useRef, useState } from "react";

import { ChatComposerToolbar } from "@/features/chat/components/chat-composer-toolbar";
import { ChatSelectedAttachments } from "@/features/chat/components/chat-selected-attachments";
import { LibraryFileInput } from "@/features/library/components/library-file-input";
import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CHAT_MODEL_ID,
  type ChatModelId,
} from "@/src/entities/models/chat-model";

type ChatFilePickerShortcut = Pick<
  KeyboardEvent,
  "ctrlKey" | "key" | "metaKey"
>;

/** Returns whether keyboard event opens chat composer file picker. */
export function isChatFilePickerShortcut(event: ChatFilePickerShortcut) {
  return event.key.toLowerCase() === "u" && (event.metaKey || event.ctrlKey);
}

/** Message draft, selected model, and files submitted by chat composer. */
export type ChatComposerSubmission = {
  readonly attachments: readonly File[];
  readonly modelId: ChatModelId;
  readonly text: string;
  readonly webSearchEnabled: boolean;
};

/** Validates that chat composer has text or at least one attachment. */
export function validateChatComposerMessage(
  text: string,
  attachments: readonly File[]
) {
  if (!text.trim() && attachments.length === 0) {
    return "Enter a message or attach a file.";
  }

  return undefined;
}

type ChatComposerProps = {
  attachments: File[];
  attachmentsEnabled?: boolean;
  className?: string;
  draft: string;
  isGenerating: boolean;
  onAnnouncementChange: (announcement: string) => void;
  onAttachmentsChange: (attachments: File[]) => void;
  onDraftChange: (draft: string) => void;
  onModelChange: (modelId: ChatModelId) => void;
  onSendMessage: (submission: ChatComposerSubmission) => Promise<void>;
  onStopResponse: () => void;
  onWebSearchChange: (checked: boolean) => void;
  selectedModelId: ChatModelId;
  webSearchEnabled: boolean;
};

const ignoreChatComposerLoadingAction = () => {};
async function ignoreChatComposerLoadingSubmission() {}

/** Renders normal chat composer disabled while page data loads. */
export function ChatComposerLoading({ className }: { className?: string }) {
  return (
    <fieldset
      aria-hidden="true"
      className="contents"
      data-slot="chat-loading-composer"
      disabled
    >
      <ChatComposer
        attachments={[]}
        className={className}
        draft=""
        isGenerating={false}
        onAnnouncementChange={ignoreChatComposerLoadingAction}
        onAttachmentsChange={ignoreChatComposerLoadingAction}
        onDraftChange={ignoreChatComposerLoadingAction}
        onModelChange={ignoreChatComposerLoadingAction}
        onSendMessage={ignoreChatComposerLoadingSubmission}
        onStopResponse={ignoreChatComposerLoadingAction}
        onWebSearchChange={ignoreChatComposerLoadingAction}
        selectedModelId={DEFAULT_CHAT_MODEL_ID}
        webSearchEnabled={false}
      />
    </fieldset>
  );
}

/** Renders controlled chat draft and file attachment form. */
export function ChatComposer({
  attachments,
  attachmentsEnabled = true,
  className,
  draft,
  isGenerating,
  onAnnouncementChange,
  onAttachmentsChange,
  onDraftChange,
  onModelChange,
  onSendMessage,
  onStopResponse,
  onWebSearchChange,
  selectedModelId,
  webSearchEnabled,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const error = hasAttemptedSubmit
    ? validateChatComposerMessage(draft, attachments)
    : undefined;
  const canSend =
    !isGenerating && !validateChatComposerMessage(draft, attachments);

  useEffect(() => {
    function openChatFilePickerFromShortcut(event: KeyboardEvent) {
      if (!attachmentsEnabled || !isChatFilePickerShortcut(event)) {
        return;
      }

      event.preventDefault();
      fileInputRef.current?.click();
    }

    document.addEventListener("keydown", openChatFilePickerFromShortcut);
    return () =>
      document.removeEventListener("keydown", openChatFilePickerFromShortcut);
  }, [attachmentsEnabled]);

  return (
    <form
      className={cn("relative z-10 w-full max-w-3xl shrink-0 px-4", className)}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setHasAttemptedSubmit(true);

        const messageText = draft.trim();
        if (
          isGenerating ||
          validateChatComposerMessage(messageText, attachments)
        ) {
          return;
        }

        setHasAttemptedSubmit(false);
        onAnnouncementChange("");
        void onSendMessage({
          attachments,
          modelId: selectedModelId,
          text: messageText,
          webSearchEnabled,
        });
      }}
    >
      <div className="rounded-lg bg-background">
        {attachmentsEnabled && (
          <LibraryFileInput
            ref={fileInputRef}
            aria-label="Choose files to attach"
            hidden
            name="attachments"
            onFiles={(files) => onAttachmentsChange([...attachments, ...files])}
          />
        )}

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
              <FieldError id="chat-composer-message-error">{error}</FieldError>
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
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask anything..."
            value={draft}
          />

          <ChatComposerToolbar
            canSend={canSend}
            isGenerating={isGenerating}
            onAnnouncementChange={onAnnouncementChange}
            onChooseFiles={() => {
              if (attachmentsEnabled) {
                fileInputRef.current?.click();
              } else {
                onAnnouncementChange(
                  "Attachments can be added after the Chat starts."
                );
              }
            }}
            onModelChange={onModelChange}
            onStopResponse={onStopResponse}
            onWebSearchChange={onWebSearchChange}
            selectedModelId={selectedModelId}
            webSearchEnabled={webSearchEnabled}
          />
        </InputGroup>
      </div>
    </form>
  );
}
