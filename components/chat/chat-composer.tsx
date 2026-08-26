import Image from "next/image"
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react"
import {
  ArrowUpIcon,
  ChevronDownIcon,
  FileTextIcon,
  FolderClosedIcon,
  GlobeIcon,
  PaperclipIcon,
  PlusIcon,
  TelescopeIcon,
  XIcon,
} from "lucide-react"

import { ChatTouchTarget } from "@/components/chat/chat-touch-target"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const CHAT_MODEL_OPTIONS = [
  "Claude Opus 5",
  "Claude Sonnet 5",
  "Claude Haiku 4.5",
  "GPT-5.6 Sol",
  "GPT-5.6 Luna",
  "Grok Build 0.1",
] as const
const DEFAULT_CHAT_MODEL = "Grok Build 0.1"

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

function ChatSelectedAttachments({
  className,
  files,
  onRemoveFile,
}: {
  className?: string
  files: readonly File[]
  onRemoveFile: (file: File) => void
}) {
  return (
    <AttachmentGroup className={cn("w-full", className)}>
      {files.map((file) => (
        <Attachment key={`${file.name}-${file.lastModified}`} size="xs">
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
              onClick={() => onRemoveFile(file)}
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
  )
}

function ChatConnectorMenuItem({
  checked,
  className,
  iconSrc,
  label,
  onCheckedChange,
}: {
  checked: boolean
  className?: string
  iconSrc: string
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      className={cn(
        "justify-between pr-1.5 *:data-[slot=dropdown-menu-checkbox-item-indicator]:hidden",
        className
      )}
      onCheckedChange={onCheckedChange}
      onSelect={(event) => event.preventDefault()}
    >
      <span className="flex items-center gap-1.5">
        <Image
          alt=""
          className="shrink-0"
          height={16}
          src={iconSrc}
          width={16}
        />
        {label}
      </span>
      <Switch
        aria-hidden="true"
        checked={checked}
        className="pointer-events-none"
        size="sm"
        tabIndex={-1}
      />
    </DropdownMenuCheckboxItem>
  )
}

function ChatComposerAddMenu({
  className,
  figmaConnected,
  googleDriveConnected,
  onAnnouncementChange,
  onChooseFiles,
  onFigmaConnectedChange,
  onGoogleDriveConnectedChange,
  onResearchModeChange,
  onWebSearchChange,
  researchModeEnabled,
  webSearchEnabled,
}: {
  className?: string
  figmaConnected: boolean
  googleDriveConnected: boolean
  onAnnouncementChange: (announcement: string) => void
  onChooseFiles: () => void
  onFigmaConnectedChange: (checked: boolean) => void
  onGoogleDriveConnectedChange: (checked: boolean) => void
  onResearchModeChange: (checked: boolean) => void
  onWebSearchChange: (checked: boolean) => void
  researchModeEnabled: boolean
  webSearchEnabled: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <InputGroupButton
            aria-label="Add attachments and tools"
            className={cn("relative shrink-0", className)}
            size="icon-sm"
            title="Add attachments and tools"
            type="button"
          />
        }
      >
        <PlusIcon />
        <ChatTouchTarget />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60" side="top">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onChooseFiles}>
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
            onCheckedChange={onWebSearchChange}
            onSelect={(event) => event.preventDefault()}
          >
            <GlobeIcon />
            Web search
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={researchModeEnabled}
            onCheckedChange={onResearchModeChange}
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
              onAnnouncementChange(
                "Connector setup is not connected in this UI demo."
              )
            }
          >
            <PlusIcon />
            Add connector
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              onAnnouncementChange(
                "Connector management is not connected in this UI demo."
              )
            }
          >
            <FolderClosedIcon />
            Manage connectors
          </DropdownMenuItem>
          <ChatConnectorMenuItem
            checked={figmaConnected}
            iconSrc="/figma.svg"
            label="Figma"
            onCheckedChange={onFigmaConnectedChange}
          />
          <ChatConnectorMenuItem
            checked={googleDriveConnected}
            iconSrc="/google-drive.svg"
            label="Google Drive"
            onCheckedChange={onGoogleDriveConnectedChange}
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ChatModelMenu({
  className,
  onModelChange,
  selectedModel,
}: {
  className?: string
  onModelChange: (model: string) => void
  selectedModel: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <InputGroupButton
            className={cn("min-w-0 gap-1 px-2", className)}
            size="sm"
            type="button"
          />
        }
      >
        <span className="truncate text-foreground">{selectedModel}</span>
        <ChevronDownIcon className="shrink-0" data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-fit min-w-60"
        side="top"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Model</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            onValueChange={onModelChange}
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
  )
}

function ChatComposerSubmitButton({
  className,
  isGenerating,
  onStopResponse,
}: {
  className?: string
  isGenerating: boolean
  onStopResponse: () => void
}) {
  return isGenerating ? (
    <InputGroupButton
      aria-label="Stop response"
      className={cn("relative shrink-0", className)}
      onClick={onStopResponse}
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
      className={cn("relative shrink-0", className)}
      size="icon-sm"
      title="Send message"
      type="submit"
      variant="default"
    >
      <ArrowUpIcon />
      <ChatTouchTarget />
    </InputGroupButton>
  )
}

type ChatComposerProps = {
  attachments: File[]
  className?: string
  draft: string
  isGenerating: boolean
  onAnnouncementChange: (announcement: string) => void
  onAttachmentsChange: Dispatch<SetStateAction<File[]>>
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
  const [figmaConnected, setFigmaConnected] = useState(true)
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)
  const [researchModeEnabled, setResearchModeEnabled] = useState(false)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)

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

  function submitChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const messageText = draft.trim()

    if (isGenerating || (!messageText && attachments.length === 0)) {
      return
    }

    onAnnouncementChange("")
    void onSendMessage({ attachments, text: messageText })
  }

  return (
    <form
      className={cn(
        "relative z-10 w-full max-w-3xl shrink-0 px-4",
        className
      )}
      onSubmit={submitChatMessage}
    >
      <div className="rounded-lg bg-background">
        <input
          ref={fileInputRef}
          aria-label="Choose files to attach"
          hidden
          multiple
          name="attachments"
          onChange={(event) => {
            onAttachmentsChange((currentAttachments) => [
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
              <ChatSelectedAttachments
                files={attachments}
                onRemoveFile={(file) =>
                  onAttachmentsChange((currentAttachments) =>
                    currentAttachments.filter(
                      (currentFile) => currentFile !== file
                    )
                  )
                }
              />
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

          <InputGroupAddon align="block-end" className="gap-1 p-2 pt-0">
            <ChatComposerAddMenu
              className="-mr-1"
              figmaConnected={figmaConnected}
              googleDriveConnected={googleDriveConnected}
              onAnnouncementChange={onAnnouncementChange}
              onChooseFiles={() => fileInputRef.current?.click()}
              onFigmaConnectedChange={setFigmaConnected}
              onGoogleDriveConnectedChange={setGoogleDriveConnected}
              onResearchModeChange={setResearchModeEnabled}
              onWebSearchChange={setWebSearchEnabled}
              researchModeEnabled={researchModeEnabled}
              webSearchEnabled={webSearchEnabled}
            />
            <ChatModelMenu
              onModelChange={setSelectedModel}
              selectedModel={selectedModel}
            />
            <ChatComposerSubmitButton
              className="ml-auto"
              isGenerating={isGenerating}
              onStopResponse={onStopResponse}
            />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </form>
  )
}
