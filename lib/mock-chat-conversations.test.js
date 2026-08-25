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

test("Stripe Billing thread seeds web search states", () => {
  const conversationTitle = "Stripe Billing pricing"
  const messages = buildMockChatMessages(conversationTitle)
  const webSearches = messages.flatMap(({ webSearches = [] }) => webSearches)

  expect(
    mockChatConversations.some(({ title }) => title === conversationTitle)
  ).toBe(true)
  expect(webSearches).toEqual([
    {
      query: "current Stripe Billing pricing and fees",
      status: "searching",
    },
    {
      query: "current Stripe Billing pricing and fees",
      status: "searched",
    },
    {
      query: "Stripe Billing custom volume discounts",
      status: "failed",
    },
  ])
  expect(messages.map(({ content }) => content).join("\n\n")).toContain(
    "0.7% of Billing volume"
  )
})

test("billing recommendation thread seeds questionnaire", () => {
  const conversationTitle = "Billing: build or buy"
  const messages = buildMockChatMessages(conversationTitle)

  expect(
    mockChatConversations.some(({ title }) => title === conversationTitle)
  ).toBe(true)
  expect(messages.map(({ role }) => role)).toEqual(["user", "assistant"])
  expect(messages.some(({ questionnaire }) => questionnaire)).toBe(true)
})

test("checkout failure thread seeds tool states", () => {
  const conversationTitle = "Checkout 500s"
  const messages = buildMockChatMessages(conversationTitle)
  const tools = messages.flatMap(({ tools = [] }) => tools)

  expect(
    mockChatConversations.some(({ title }) => title === conversationTitle)
  ).toBe(true)
  expect(tools.map(({ state }) => state)).toEqual([
    "running",
    "completed",
    "failed",
    "denied",
  ])
  expect(tools.find(({ state }) => state === "failed")?.payload).toEqual({
    error: "billing.acme.internal timed out after 10s",
  })
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
