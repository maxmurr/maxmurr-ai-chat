import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ChatListRowsSkeleton } from "@/features/chat/components/chat-list-rows-skeleton";

test("Chat list rows skeleton forwards status attributes and reserves five rows", () => {
  const markup = renderToStaticMarkup(
    <ChatListRowsSkeleton
      aria-label="Loading filtered chats"
      className="test-layout"
      role="status"
    />
  );

  assert.match(markup, /aria-label="Loading filtered chats"/);
  assert.match(markup, /class="test-layout"/);
  assert.equal(markup.match(/data-slot="skeleton"/g)?.length, 15);
});
