import { useRef, useState } from "react"
import { CheckIcon, CircleAlertIcon, CopyIcon } from "lucide-react"

import { TouchTarget } from "@/components/ui/touch-target"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

type ChatShareCopyStatus = "idle" | "copied" | "error"

type ChatShareLinkFieldProps = {
  className?: string
  isGenerating: boolean
  shareLink: string | null
}

/** Renders generated chat share link with clipboard status. */
export function ChatShareLinkField({
  className,
  isGenerating,
  shareLink,
}: ChatShareLinkFieldProps) {
  const shareLinkInputRef = useRef<HTMLInputElement>(null)
  const [copyStatus, setCopyStatus] =
    useState<ChatShareCopyStatus>("idle")

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
  const shareLinkAnnouncement = isGenerating
    ? "Creating share link."
    : copyStatus === "copied"
      ? "Share link copied."
      : copyStatus === "error"
        ? "Could not copy share link. Link selected for manual copying."
        : "Share link ready."

  return (
    <div className={cn(className)}>
      <InputGroup aria-busy={isGenerating} className="h-14">
        <InputGroupInput
          ref={shareLinkInputRef}
          aria-label="Share link"
          autoComplete="off"
          className={cn(
            "h-full font-mono",
            isGenerating && "text-muted-foreground"
          )}
          name="share-link"
          readOnly
          spellCheck={false}
          tabIndex={isGenerating ? -1 : undefined}
          type="url"
          value={isGenerating ? "Creating link…" : (shareLink ?? "")}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={copyButtonLabel}
            className="relative"
            disabled={isGenerating}
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
            <TouchTarget />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p className="sr-only" role="status">
        {shareLinkAnnouncement}
      </p>
    </div>
  )
}
