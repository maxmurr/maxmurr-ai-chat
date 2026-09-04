import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
  ChatsBrowser,
  mergeChatListPage,
} from "@/features/chat/components/chats-browser";
import type { ChatListBrowserEntry } from "@/features/chat/chat-list-contract";

const firstChat: ChatListBrowserEntry = {
  activeStreamId: null,
  hasUnreadResponse: true,
  id: "10000000-0000-4000-8000-000000000001",
  pinned: false,
  projectId: null,
  projectName: null,
  publicToken: null,
  searchSnippet: null,
  title: "Unread launch notes",
  updatedAt: "2026-09-04T00:00:00.000Z",
  visibility: "private",
};

const secondChat: ChatListBrowserEntry = {
  ...firstChat,
  activeStreamId: "20000000-0000-4000-8000-000000000001",
  hasUnreadResponse: false,
  id: "10000000-0000-4000-8000-000000000002",
  title: "Generating launch plan",
};

test("Chat list appends cursor pages without duplicate rows", () => {
  assert.deepEqual(
    mergeChatListPage([firstChat], [firstChat, secondChat]).map(({ id }) => id),
    [firstChat.id, secondChat.id]
  );
});

test("Chats browser renders search, actions, loading, and unread states", () => {
  const markup = renderToStaticMarkup(
    <ChatsBrowser
      initialPage={{ chats: [firstChat, secondChat], nextCursor: null }}
      projects={[]}
    />
  );

  assert.match(markup, /aria-label="Search chat contents"/);
  assert.match(markup, /Unread launch notes, unread response/);
  assert.match(markup, /Generating launch plan, generating response/);
  assert.match(markup, /Open chat actions for Unread launch notes/);
  assert.match(markup, />Select</);
  assert.match(markup, />New chat</);
});
