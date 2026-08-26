import { useState } from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  TriangleAlertIcon,
} from "lucide-react"

import {
  ChatCopyButton,
  type ChatCopyResult,
} from "@/components/chat/chat-copy-button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Spinner } from "@/components/ui/spinner"
import type { ChatDisplayTool } from "@/src/interface-adapters/presenters/chat-message.presenter"
import { cn } from "@/lib/utils"

const CHAT_TOOL_STATE_METADATA = {
  running: {
    defaultOpen: true,
    label: "running",
    showLabel: false,
    statusClassName: "text-muted-foreground",
  },
  completed: {
    defaultOpen: false,
    label: "completed",
    showLabel: false,
    statusClassName: "text-muted-foreground",
  },
  failed: {
    defaultOpen: true,
    label: "failed",
    showLabel: true,
    statusClassName: "text-destructive",
  },
} as const satisfies Record<
  ChatDisplayTool["state"],
  {
    defaultOpen: boolean
    label: string
    showLabel: boolean
    statusClassName: string
  }
>

const CHAT_TOOL_STATE_ICONS = {
  running: Spinner,
  completed: CheckIcon,
  failed: TriangleAlertIcon,
} as const

type ChatMessageToolProps = {
  className?: string
  tool: ChatDisplayTool
}

/** Renders expandable state and payload for one chat tool call. */
export function ChatMessageTool({
  className,
  tool,
}: ChatMessageToolProps) {
  const [copyResult, setCopyResult] = useState<ChatCopyResult>(null)
  const stateMetadata = CHAT_TOOL_STATE_METADATA[tool.state]
  const StatusIcon = CHAT_TOOL_STATE_ICONS[tool.state]
  const formattedPayload = JSON.stringify(tool.payload, null, 2)
  const copyLabel =
    copyResult === "copied"
      ? `${tool.name} details copied`
      : copyResult === "error"
        ? `Could not copy ${tool.name} details`
        : `Copy ${tool.name} ${stateMetadata.label} details`

  async function copyChatToolDetails() {
    try {
      await navigator.clipboard.writeText(formattedPayload)
      setCopyResult("copied")
    } catch {
      setCopyResult("error")
    }
  }

  return (
    <Collapsible
      className={cn("flex w-full min-w-0 flex-col gap-2", className)}
      defaultOpen={stateMetadata.defaultOpen}
      key={tool.state}
    >
      <Marker
        aria-busy={tool.state === "running" ? true : undefined}
        className={cn(
          "w-fit rounded-sm py-1 text-base outline-none select-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm",
          stateMetadata.statusClassName
        )}
        render={<CollapsibleTrigger />}
      >
        <MarkerIcon>
          <StatusIcon />
        </MarkerIcon>
        <MarkerContent
          className={cn(tool.state === "running" && "shimmer")}
        >
          {tool.name}
          <span className={cn(!stateMetadata.showLabel && "sr-only")}>
            {` · ${stateMetadata.label}`}
          </span>
        </MarkerContent>
        <MarkerIcon>
          <ChevronDownIcon className="transition-transform group-aria-expanded/marker:rotate-180" />
        </MarkerIcon>
      </Marker>

      <CollapsibleContent>
        <Card className="w-fit max-w-full" size="sm">
          <CardHeader className="border-b">
            <CardTitle>
              <code>{tool.name}</code>
            </CardTitle>
            <CardAction>
              <ChatCopyButton
                aria-label={copyLabel}
                copyResult={copyResult}
                onClick={copyChatToolDetails}
                title={copyLabel}
              />
              <span className="sr-only" role="status">
                {copyResult === "copied"
                  ? `${tool.name} details copied.`
                  : copyResult === "error"
                    ? `Could not copy ${tool.name} details.`
                    : ""}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent className="min-w-0">
            <pre className="max-w-full overflow-x-auto text-base/7 wrap-break-word whitespace-pre-wrap tabular-nums sm:text-sm/6">
              <code>{formattedPayload}</code>
            </pre>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
