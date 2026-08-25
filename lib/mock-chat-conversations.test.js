import { expect, test } from "bun:test"

import { mockChatConversations } from "@/lib/mock-chat-conversations"

test("mock chat conversation IDs are unique", () => {
  const conversationIds = mockChatConversations.map(({ id }) => id)

  expect(new Set(conversationIds).size).toBe(conversationIds.length)
})
