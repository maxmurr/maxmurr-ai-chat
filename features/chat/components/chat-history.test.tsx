import assert from "node:assert/strict"
import { test } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

import { ChatHistory } from "@/features/chat/components/chat-history"
import { SidebarProvider } from "@/components/ui/sidebar"

test("chat history renders collapsible sections outside active chat title provider", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <ChatHistory
        ownChats={[
          {
            id: "pinned-chat",
            pinned: true,
            publicToken: null,
            title: "Pinned chat",
            updatedAt: new Date(),
            visibility: "private",
          },
          {
            id: "recent-chat",
            pinned: false,
            publicToken: null,
            title: "Recent chat",
            updatedAt: new Date(),
            visibility: "private",
          },
        ]}
        teamChats={[]}
      />
    </SidebarProvider>
  )

  assert.match(markup, />Pinned</)
  assert.match(markup, />Recents</)
  assert.equal(markup.match(/aria-expanded="true"/g)?.length, 2)
  assert.match(
    markup,
    /group-aria-expanded\/chat-history-trigger:rotate-180/
  )
  assert.doesNotMatch(markup, />Today</)
  assert.doesNotMatch(markup, />Yesterday</)
})
