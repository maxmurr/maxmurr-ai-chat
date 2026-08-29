import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
  ChatSearch,
  formatChatSearchUpdatedDate,
} from "@/features/chat/components/chat-search";
import { SidebarMenu, SidebarProvider } from "@/components/ui/sidebar";

test("chat search renders its trigger and formats result dates", () => {
  const now = new Date(2026, 7, 29, 12);
  const today = new Date(2026, 7, 29, 8);
  const yesterday = new Date(2026, 7, 28, 20);
  const older = new Date(2026, 7, 12, 20);

  assert.equal(formatChatSearchUpdatedDate(today, now), "Today");
  assert.equal(formatChatSearchUpdatedDate(yesterday, now), "Yesterday");
  assert.equal(formatChatSearchUpdatedDate(older, now), "Aug 12");

  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <SidebarMenu>
        <ChatSearch
          chats={[
            {
              id: "pricing-chat",
              title: "Review our pricing page",
              updatedAt: today,
            },
          ]}
        />
      </SidebarMenu>
    </SidebarProvider>
  );

  assert.match(markup, /type="button"[^>]*>.*Search/);
  assert.match(markup, />Search<\/h2>/);
  assert.match(markup, /Search chats or jump to a section\./);
});
