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

test("pricing design feedback seeds rich message content", () => {
  const conversationTitle = "Pricing page design feedback"
  const messages = buildMockChatMessages(conversationTitle)
  const attachments = messages.flatMap(({ attachments = [] }) => attachments)
  const messageIds = messages.map(({ id }) => id)
  const markdown = messages.map(({ content }) => content).join("\n\n")
  const sources = messages.flatMap(({ sources = [] }) => sources)

  expect(
    mockChatConversations.some(({ title }) => title === conversationTitle)
  ).toBe(true)
  expect(new Set(messageIds).size).toBe(messageIds.length)
  expect(attachments).toContainEqual({
    filename: "pricing-current.svg",
    mediaType: "image/svg+xml",
    previewImageSrc: "/pricing-page-preview.png",
  })
  expect(sources).toHaveLength(3)
  expect(sources).toContainEqual({
    href: "https://stripe.com/billing",
    label: "stripe.com",
    title: "Billing overview",
  })
  expect(markdown).toContain("```css")
  expect(markdown).toContain("| Plan | Label |")
  expect(markdown).toContain("**Hierarchy.**")
})
