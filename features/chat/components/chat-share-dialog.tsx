"use client"

import { useId, useState, useSyncExternalStore, useTransition } from "react"
import { CircleAlertIcon, Share2Icon } from "lucide-react"

import { updateChatSharingAction } from "@/features/chat/chat-actions"
import { ChatShareLinkField } from "@/features/chat/components/chat-share-link-field"
import { TouchTarget } from "@/components/ui/touch-target"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import type { ChatVisibility } from "@/src/entities/models/chat"
import { cn } from "@/lib/utils"

type ChatShareDialogContentProps = {
  chatId: string
  className?: string
  initialPublicToken: string | null
  initialVisibility: ChatVisibility
}
type ChatShareDialogProps = ChatShareDialogContentProps

const CHAT_SHARE_ORIGIN_SUBSCRIBE = () => () => {}
const CHAT_SHARE_ORIGIN_SERVER_SNAPSHOT = () => null

const CHAT_SHARE_ACCESS_OPTIONS: readonly {
  description: string
  title: string
  value: ChatVisibility
}[] = [
  {
    description: "Only you have access.",
    title: "Keep private",
    value: "private",
  },
  {
    description: "Teammates in this workspace can view.",
    title: "Share with your team",
    value: "workspace",
  },
  {
    description: "Anyone with the link can view.",
    title: "Create public link",
    value: "public",
  },
]

/** Builds the viewer URL for one shared chat visibility. */
export function buildChatShareLink(
  chatId: string,
  visibility: ChatVisibility,
  publicToken: string | null,
  origin: string
) {
  if (visibility === "private") {
    return null
  }

  if (visibility === "workspace") {
    return `${origin}/chat/${encodeURIComponent(chatId)}`
  }

  return publicToken
    ? `${origin}/share/${encodeURIComponent(publicToken)}`
    : null
}

function ChatShareAccessOption({
  className,
  description,
  id,
  title,
  value,
}: {
  className?: string
  description: string
  id: string
  title: string
  value: ChatVisibility
}) {
  return (
    <FieldLabel className={cn(className)} htmlFor={id}>
      <Field orientation="horizontal">
        <FieldContent className="min-w-0">
          <FieldTitle>{title}</FieldTitle>
          <FieldDescription>{description}</FieldDescription>
        </FieldContent>
        <RadioGroupItem id={id} value={value} />
      </Field>
    </FieldLabel>
  )
}

/** Renders shared chat visibility choices for any dialog trigger. */
export function ChatShareDialogContent({
  chatId,
  className,
  initialPublicToken,
  initialVisibility,
}: ChatShareDialogContentProps) {
  const optionIdPrefix = useId()
  const legendId = `${optionIdPrefix}-legend`
  const [shareAccess, setShareAccess] =
    useState<ChatVisibility>(initialVisibility)
  const [publicToken, setPublicToken] = useState(initialPublicToken)
  const [shareError, setShareError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()
  const origin = useSyncExternalStore(
    CHAT_SHARE_ORIGIN_SUBSCRIBE,
    () => window.location.origin,
    CHAT_SHARE_ORIGIN_SERVER_SNAPSHOT
  )

  function changeChatShareAccess(nextAccess: ChatVisibility) {
    const previousAccess = shareAccess
    setShareAccess(nextAccess)
    setShareError(null)

    startSaving(async () => {
      const result = await updateChatSharingAction(chatId, nextAccess)

      if (!result.ok) {
        setShareAccess(previousAccess)
        setShareError(result.error)
        return
      }

      setPublicToken(result.publicToken)
    })
  }

  const isGeneratingShareLink = isSaving || origin === null
  const shareLink = isGeneratingShareLink
    ? null
    : buildChatShareLink(chatId, shareAccess, publicToken, origin)

  return (
    <DialogContent className={cn(className)}>
      <DialogHeader>
        <DialogTitle>Share chat</DialogTitle>
        <DialogDescription>
          Viewers see the conversation as it is now, including new messages.
        </DialogDescription>
      </DialogHeader>

      <FieldSet>
        <FieldLegend className="sr-only" id={legendId}>
          Chat sharing access
        </FieldLegend>
        <RadioGroup
          aria-labelledby={legendId}
          name="chat-share-access"
          onValueChange={(value) =>
            changeChatShareAccess(value as ChatVisibility)
          }
          value={shareAccess}
        >
          {CHAT_SHARE_ACCESS_OPTIONS.map((option) => (
            <ChatShareAccessOption
              description={option.description}
              id={`${optionIdPrefix}-${option.value}`}
              key={option.value}
              title={option.title}
              value={option.value}
            />
          ))}
        </RadioGroup>
      </FieldSet>

      {shareError && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{shareError}</AlertDescription>
        </Alert>
      )}

      {shareAccess !== "private" && !shareError && (
        <ChatShareLinkField
          isGenerating={isGeneratingShareLink}
          key={shareAccess}
          shareLink={shareLink}
        />
      )}
    </DialogContent>
  )
}

/** Renders header share action with its accessible dialog. */
export function ChatShareDialog({
  chatId,
  className,
  initialPublicToken,
  initialVisibility,
}: ChatShareDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            className={cn("relative", className)}
            size="sm"
            variant="ghost"
          />
        }
      >
        <Share2Icon data-icon="inline-start" />
        Share
        <TouchTarget />
      </DialogTrigger>
      <ChatShareDialogContent
        chatId={chatId}
        initialPublicToken={initialPublicToken}
        initialVisibility={initialVisibility}
      />
    </Dialog>
  )
}
