"use client"

import { useEffect, useId, useRef, useState } from "react"
import {
  CheckIcon,
  CircleAlertIcon,
  CopyIcon,
  Share2Icon,
} from "lucide-react"

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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

type ChatShareAccess = "private" | "team" | "public"
type ChatShareCopyStatus = "idle" | "copied" | "error"
type ChatShareDialogProps = {
  conversationId: string
}

/** Builds deterministic mock share URL while chat backend remains local-only. */
export function buildChatShareLink(conversationId: string) {
  return `https://chat.example.com/share/${encodeURIComponent(conversationId)}`
}

/** Renders shared chat visibility choices for any dialog trigger. */
export function ChatShareDialogContent({
  conversationId,
}: ChatShareDialogProps) {
  const optionIdPrefix = useId()
  const legendId = `${optionIdPrefix}-legend`
  const shareLinkInputRef = useRef<HTMLInputElement>(null)
  const [copyStatus, setCopyStatus] =
    useState<ChatShareCopyStatus>("idle")
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
    setCopyStatus("idle")

    if (nextAccess === "private") {
      setShareLink(null)
    }
  }

  async function copyChatShareLink() {
    if (!shareLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(shareLink)
      setCopyStatus("copied")
    } catch {
      shareLinkInputRef.current?.select()
      setCopyStatus("error")
    }
  }

  const copyButtonLabel =
    copyStatus === "copied"
      ? "Link copied"
      : copyStatus === "error"
        ? "Copy failed. Select the link and copy manually."
        : "Copy link"
  const shareLinkAnnouncement = isGeneratingLink
    ? "Creating share link."
    : copyStatus === "copied"
      ? "Share link copied."
      : copyStatus === "error"
        ? "Could not copy share link. Link selected for manual copying."
        : "Share link ready."

  return (
    <DialogContent>
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
          <FieldLabel htmlFor={`${optionIdPrefix}-private`}>
            <Field orientation="horizontal">
              <FieldContent className="min-w-0">
                <FieldTitle>Keep private</FieldTitle>
                <FieldDescription>Only you have access.</FieldDescription>
              </FieldContent>
              <RadioGroupItem
                id={`${optionIdPrefix}-private`}
                value="private"
              />
            </Field>
          </FieldLabel>

          <FieldLabel htmlFor={`${optionIdPrefix}-team`}>
            <Field orientation="horizontal">
              <FieldContent className="min-w-0">
                <FieldTitle>Share with your team</FieldTitle>
                <FieldDescription>
                  Only teammates with the link can view.
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem id={`${optionIdPrefix}-team`} value="team" />
            </Field>
          </FieldLabel>

          <FieldLabel htmlFor={`${optionIdPrefix}-public`}>
            <Field orientation="horizontal">
              <FieldContent className="min-w-0">
                <FieldTitle>Create public link</FieldTitle>
                <FieldDescription>
                  Anyone with the link can view.
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem
                id={`${optionIdPrefix}-public`}
                value="public"
              />
            </Field>
          </FieldLabel>
        </RadioGroup>
      </FieldSet>

      {shareAccess !== "private" && (
        <>
          <InputGroup aria-busy={isGeneratingLink} className="h-14">
            <InputGroupInput
              ref={shareLinkInputRef}
              aria-label="Share link"
              autoComplete="off"
              className={cn(
                "h-full font-mono",
                isGeneratingLink && "text-muted-foreground"
              )}
              name="share-link"
              readOnly
              spellCheck={false}
              tabIndex={isGeneratingLink ? -1 : undefined}
              type="url"
              value={isGeneratingLink ? "Creating link…" : (shareLink ?? "")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label={copyButtonLabel}
                className="relative"
                disabled={isGeneratingLink}
                onClick={copyChatShareLink}
                size="icon-xs"
                title={copyButtonLabel}
                type="button"
              >
                {copyStatus === "copied" ? (
                  <CheckIcon />
                ) : copyStatus === "error" ? (
                  <CircleAlertIcon />
                ) : (
                  <CopyIcon />
                )}
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
                />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <p className="sr-only" role="status">
            {shareLinkAnnouncement}
          </p>
        </>
      )}
    </DialogContent>
  )
}

/** Renders header share action with its accessible dialog. */
export function ChatShareDialog({ conversationId }: ChatShareDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="relative" size="sm" variant="ghost" />
        }
      >
        <Share2Icon data-icon="inline-start" />
        Share
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
        />
      </DialogTrigger>
      <ChatShareDialogContent conversationId={conversationId} />
    </Dialog>
  )
}
