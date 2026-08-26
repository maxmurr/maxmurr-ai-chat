"use client"

import { useEffect, useId, useState } from "react"
import { Share2Icon } from "lucide-react"

import { ChatShareLinkField } from "@/components/chat/chat-share-link-field"
import { ChatTouchTarget } from "@/components/chat/chat-touch-target"
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
import { cn } from "@/lib/utils"

type ChatShareAccess = "private" | "team" | "public"
type ChatShareDialogContentProps = {
  className?: string
  conversationId: string
}
type ChatShareDialogProps = {
  className?: string
  conversationId: string
}

const CHAT_SHARE_ACCESS_OPTIONS: readonly {
  description: string
  title: string
  value: ChatShareAccess
}[] = [
  {
    description: "Only you have access.",
    title: "Keep private",
    value: "private",
  },
  {
    description: "Only teammates with the link can view.",
    title: "Share with your team",
    value: "team",
  },
  {
    description: "Anyone with the link can view.",
    title: "Create public link",
    value: "public",
  },
]

/** Builds deterministic mock share URL while chat backend remains local-only. */
export function buildChatShareLink(conversationId: string) {
  return `https://chat.example.com/share/${encodeURIComponent(conversationId)}`
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
  value: ChatShareAccess
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
  className,
  conversationId,
}: ChatShareDialogContentProps) {
  const optionIdPrefix = useId()
  const legendId = `${optionIdPrefix}-legend`
  const [shareAccess, setShareAccess] =
    useState<ChatShareAccess>("private")
  const [shareLink, setShareLink] = useState<string | null>(null)
  const isGeneratingLink = shareAccess !== "private" && shareLink === null

  useEffect(() => {
    if (shareAccess === "private" || shareLink) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShareLink(buildChatShareLink(conversationId))
    }, 750)

    return () => window.clearTimeout(timeoutId)
  }, [conversationId, shareAccess, shareLink])

  function changeChatShareAccess(nextAccess: ChatShareAccess) {
    setShareAccess(nextAccess)

    if (nextAccess === "private") {
      setShareLink(null)
    }
  }

  return (
    <DialogContent className={cn(className)}>
      <DialogHeader>
        <DialogTitle>Share chat</DialogTitle>
        <DialogDescription>
          Only messages up to this point are shared. Anything sent later is
          not.
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
            changeChatShareAccess(value as ChatShareAccess)
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

      {shareAccess !== "private" && (
        <ChatShareLinkField
          isGenerating={isGeneratingLink}
          key={shareAccess}
          shareLink={shareLink}
        />
      )}
    </DialogContent>
  )
}

/** Renders header share action with its accessible dialog. */
export function ChatShareDialog({
  className,
  conversationId,
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
        <ChatTouchTarget />
      </DialogTrigger>
      <ChatShareDialogContent conversationId={conversationId} />
    </Dialog>
  )
}
