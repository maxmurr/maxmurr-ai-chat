import { expect, test } from "bun:test"

import {
  buildMockChatMessages,
  mockChatConversations,
} from "@/lib/mock-chat-conversations"

test("mock chat conversation IDs are unique", () => {
  const conversationIds = mockChatConversations.map(({ id }) => id)

  expect(new Set(conversationIds).size).toBe(conversationIds.length)
})

test("mock chat messages seed existing threads only", () => {
  expect(buildMockChatMessages()).toEqual([])
  expect(
    buildMockChatMessages("Review pricing").map(({ role }) => role)
  ).toEqual(["user", "assistant"])
})
