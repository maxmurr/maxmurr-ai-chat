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
  const firstRow = markup.match(
    /<li[^>]*class="[^"]*group\/chat-list-row[^"]*"[^>]*>/
  )?.[0];
  const updatedAt = markup.match(/<time[^>]*>/)?.[0];
  const actionsButton = markup.match(
    /<button[^>]*aria-label="Open chat actions for Unread launch notes"[^>]*>/
  )?.[0];

  assert.ok(firstRow);
  assert.match(firstRow, /min-h-12/);
  assert.match(firstRow, /rounded-lg/);
  assert.match(firstRow, /focus-within:bg-muted/);
  assert.match(firstRow, /pointer-fine:hover:bg-muted/);
  assert.match(firstRow, /after:bg-border/);
  assert.match(firstRow, /last:after:hidden/);
  assert.ok(updatedAt);
  assert.match(updatedAt, /pointer-events-none/);
  assert.match(updatedAt, /pointer-fine:group-hover\/chat-list-row:opacity-0/);
  assert.ok(actionsButton);
  assert.match(actionsButton, /pointer-fine:absolute/);
  assert.match(actionsButton, /pointer-fine:right-3/);
  assert.match(
    actionsButton,
    /pointer-fine:group-hover\/chat-list-row:opacity-100/
  );
  assert.match(markup, /has-data-popup-open:\[&amp;&gt;time\]:opacity-0/);
  assert.match(markup, /lucide-ellipsis-vertical/);
  assert.match(markup, />Select</);
  assert.match(markup, />New chat</);
});
