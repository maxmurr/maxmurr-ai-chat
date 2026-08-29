import assert from "node:assert/strict"
import { test } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

import { ChatMessageList } from "@/features/chat/components/chat-message-list"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { ChatDisplayMessage } from "@/src/interface-adapters/presenters/chat-message.presenter"

test("chat message list marks each local calendar day", () => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setUTCDate(today.getUTCDate() - 1)
  const messages = [
    {
      content: "Yesterday message",
      createdAt: yesterday.toISOString(),
      id: "yesterday-message",
      role: "user",
    },
    {
      content: "Today message",
      createdAt: today.toISOString(),
      id: "today-message",
      role: "user",
    },
  ] as ChatDisplayMessage[]
  const markup = renderToStaticMarkup(
    <TooltipProvider>
      <ChatMessageList
        isGenerating={false}
        messages={messages}
        onSuggestionSelect={() => {}}
        status="ready"
      />
    </TooltipProvider>
  )
  const markers = Array.from(
    markup.matchAll(/data-slot="marker-content"[^>]*>([^<]+)<\/span>/g),
    (match) => match[1]
  )

  assert.equal(markers.length, 2)
  assert.match(markers[0], /^Yesterday \d{1,2}:\d{2} [AP]M$/)
  assert.match(markers[1], /^Today \d{1,2}:\d{2} [AP]M$/)
})
