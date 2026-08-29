import Image from "next/image"
import { useState } from "react"
import {
  ArrowUpIcon,
  ChevronDownIcon,
  FolderClosedIcon,
  GlobeIcon,
  PaperclipIcon,
  PlusIcon,
  TelescopeIcon,
  XIcon,
} from "lucide-react"

import { TouchTarget } from "@/components/ui/touch-target"
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
  InputGroupAddon,
  InputGroupButton,
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
        <TouchTarget />
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
  canSend,
  className,
  isGenerating,
  onStopResponse,
}: {
  canSend: boolean
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
      <TouchTarget />
    </InputGroupButton>
  ) : (
    <InputGroupButton
      aria-label="Send message"
      className={cn("relative shrink-0", className)}
      disabled={!canSend}
      size="icon-sm"
      title="Send message"
      type="submit"
      variant="default"
    >
      <ArrowUpIcon />
      <TouchTarget />
    </InputGroupButton>
  )
}

type ChatComposerToolbarProps = {
  canSend: boolean
  className?: string
  isGenerating: boolean
  onAnnouncementChange: (announcement: string) => void
  onChooseFiles: () => void
  onStopResponse: () => void
}

/** Renders chat composer tools, model selection, and submit control. */
export function ChatComposerToolbar({
  canSend,
  className,
  isGenerating,
  onAnnouncementChange,
  onChooseFiles,
  onStopResponse,
}: ChatComposerToolbarProps) {
  const [figmaConnected, setFigmaConnected] = useState(true)
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)
  const [researchModeEnabled, setResearchModeEnabled] = useState(false)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)

  return (
    <InputGroupAddon
      align="block-end"
      className={cn("gap-1 p-2 pt-0", className)}
    >
      <ChatComposerAddMenu
        className="-mr-1"
        figmaConnected={figmaConnected}
        googleDriveConnected={googleDriveConnected}
        onAnnouncementChange={onAnnouncementChange}
        onChooseFiles={onChooseFiles}
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
        canSend={canSend}
        className="ml-auto"
        isGenerating={isGenerating}
        onStopResponse={onStopResponse}
      />
    </InputGroupAddon>
  )
}
