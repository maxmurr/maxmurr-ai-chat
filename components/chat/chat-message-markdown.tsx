import { code } from "@streamdown/code"
import { Streamdown } from "streamdown"

import { cn } from "@/lib/utils"

const CHAT_MARKDOWN_PLUGINS = { code } as const

type ChatMessageMarkdownProps = {
  children: string
  className?: string
  isAnimating?: boolean
}

/** Renders streaming-safe Markdown for chat message content. */
export function ChatMessageMarkdown({
  children,
  className,
  isAnimating = false,
}: ChatMessageMarkdownProps) {
  return (
    <Streamdown
      caret="block"
      className={cn("text-pretty max-sm:text-base", className)}
      isAnimating={isAnimating}
      lineNumbers={false}
      plugins={CHAT_MARKDOWN_PLUGINS}
    >
      {children}
    </Streamdown>
  )
}
