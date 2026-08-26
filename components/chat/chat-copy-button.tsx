import type { ComponentProps } from "react"
import {
  CheckIcon,
  CircleAlertIcon,
  CopyIcon,
} from "lucide-react"

import { ChatTouchTarget } from "@/components/chat/chat-touch-target"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Clipboard result shown by chat copy controls. */
export type ChatCopyResult = "copied" | "error" | null

type ChatCopyButtonProps = Omit<ComponentProps<typeof Button>, "children"> & {
  copyResult: ChatCopyResult
}

/** Renders shared chat copy status control. */
export function ChatCopyButton({
  className,
  copyResult,
  ...props
}: ChatCopyButtonProps) {
  return (
    <Button
      className={cn("relative", className)}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {copyResult === "copied" ? (
        <CheckIcon />
      ) : copyResult === "error" ? (
        <CircleAlertIcon />
      ) : (
        <CopyIcon />
      )}
      <ChatTouchTarget />
    </Button>
  )
}
