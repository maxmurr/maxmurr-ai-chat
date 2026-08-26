import {
  BookOpenIcon,
  ChevronDownIcon,
  FileTextIcon,
  LinkIcon,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import type { ChatDisplaySource } from "@/src/interface-adapters/presenters/chat-message.presenter"
import { cn } from "@/lib/utils"

type ChatMessageSourcesProps = {
  className?: string
  sources: readonly ChatDisplaySource[]
}

/** Renders expandable source links and document references for one message. */
export function ChatMessageSources({
  className,
  sources,
}: ChatMessageSourcesProps) {
  return (
    <Collapsible className={cn("flex flex-col gap-1", className)}>
      <Marker
        className="w-fit rounded-sm py-1 text-base outline-none select-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm"
        render={<CollapsibleTrigger />}
      >
        <MarkerIcon>
          <BookOpenIcon />
        </MarkerIcon>
        <MarkerContent className="tabular-nums">
          {sources.length} sources
        </MarkerContent>
        <MarkerIcon>
          <ChevronDownIcon className="transition-transform group-aria-expanded/marker:rotate-180" />
        </MarkerIcon>
      </Marker>

      <CollapsibleContent>
        <ul className="flex flex-col gap-1" role="list">
          {sources.map((source) => (
            <li
              className="flex min-w-0 items-start gap-2 text-base/6 text-muted-foreground sm:text-sm/5"
              key={source.href ?? source.label}
            >
              {source.href ? (
                <LinkIcon className="size-5 shrink-0 sm:size-4" />
              ) : (
                <FileTextIcon className="size-5 shrink-0 sm:size-4" />
              )}
              {source.href ? (
                <a
                  className="min-w-0 rounded-sm text-foreground underline decoration-foreground/40 underline-offset-3 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  href={source.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {source.title}{" "}
                  <span className="text-muted-foreground">{source.label}</span>
                </a>
              ) : (
                <p className="min-w-0 text-pretty">
                  <span className="text-foreground">{source.title}</span>{" "}
                  {source.label}
                </p>
              )}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
