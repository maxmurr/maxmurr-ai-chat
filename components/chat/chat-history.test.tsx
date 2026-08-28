import assert from "node:assert/strict"
import { test } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

import { ChatConversationTitleProvider } from "@/components/chat/chat-conversation-title"
import { ChatHistory } from "@/components/chat/chat-history"
import { SidebarProvider } from "@/components/ui/sidebar"

test("chat history groups unpinned chats under Recents", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <ChatConversationTitleProvider initialTitle="">
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
      </ChatConversationTitleProvider>
    </SidebarProvider>
  )

  assert.match(markup, />Pinned</)
  assert.match(markup, />Recents</)
  assert.doesNotMatch(markup, />Today</)
  assert.doesNotMatch(markup, />Yesterday</)
})
