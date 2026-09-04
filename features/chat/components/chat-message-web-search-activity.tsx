import { GlobeIcon, TriangleAlertIcon } from "lucide-react";

import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import type { ChatDisplayWebSearch } from "@/src/interface-adapters/presenters/chat-message.presenter";
import { cn } from "@/lib/utils";

type ChatMessageWebSearchActivityProps = {
  webSearches: readonly ChatDisplayWebSearch[];
};

/** Renders live Gateway web-search activity without exposing generic tool payloads. */
export function ChatMessageWebSearchActivity({
  webSearches,
}: ChatMessageWebSearchActivityProps) {
  return (
    <ul
      aria-label="Web search activity"
      aria-live="polite"
      className="flex flex-col gap-3 py-1"
      role="list"
    >
      {webSearches.map((webSearch) => {
        const isSearching = webSearch.status === "searching";
        const query = webSearch.query ? ` for ${webSearch.query}` : "";
        const label =
          webSearch.status === "failed"
            ? "Web search failed"
            : `${isSearching ? "Searching" : "Searched"} the web${query}`;

        return (
          <li key={webSearch.id}>
            <Marker
              aria-busy={isSearching ? true : undefined}
              className="w-fit text-base sm:text-sm"
            >
              <MarkerIcon>
                {isSearching ? (
                  <Spinner />
                ) : webSearch.status === "searched" ? (
                  <GlobeIcon />
                ) : (
                  <TriangleAlertIcon />
                )}
              </MarkerIcon>
              <MarkerContent
                className={cn("text-pretty", isSearching && "shimmer")}
              >
                {label}
              </MarkerContent>
            </Marker>
          </li>
        );
      })}
    </ul>
  );
}
