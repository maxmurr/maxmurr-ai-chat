import assert from "node:assert/strict"
import { test } from "node:test"

import {
  buildInitialChatUiMessages,
  convertChatUiMessageToDisplayMessage,
  type ChatUIMessage,
} from "@/lib/chat-ui-messages"

test("seeded chat history keeps rich display metadata", () => {
  const [message] = buildInitialChatUiMessages("Billing: build or buy")

  assert.deepEqual(message.parts, [
    {
      type: "text",
      text: "We need subscription billing for the new plans. Build it in-house or use Stripe Billing? I want a recommendation, not a list of pros and cons.",
    },
  ])
  assert.deepEqual(
    convertChatUiMessageToDisplayMessage(message),
    message.metadata?.seededDisplayMessage
  )
})

test("streamed AI SDK parts map to chat reasoning, tools, files, and sources", () => {
  const message: ChatUIMessage = {
    id: "assistant-response",
    role: "assistant",
    parts: [
      { type: "reasoning", text: "Checked current plan." },
      {
        type: "dynamic-tool",
        toolCallId: "lookup-call",
        toolName: "lookup_plan",
        state: "output-available",
        input: { planId: "pro" },
        output: { price: 29 },
      },
      { type: "text", text: "Pro costs $29." },
      {
        type: "source-url",
        sourceId: "pricing",
        url: "https://example.com/pricing",
        title: "Pricing",
      },
      {
        type: "file",
        filename: "quote.pdf",
        mediaType: "application/pdf",
        url: "data:application/pdf;base64,AA==",
      },
    ],
  }

  assert.deepEqual(convertChatUiMessageToDisplayMessage(message), {
    attachments: [
      {
        filename: "quote.pdf",
        mediaType: "application/pdf",
      },
    ],
    content: "Pro costs $29.",
    id: "assistant-response",
    reasoning: "Checked current plan.",
    role: "assistant",
    sources: [
      {
        href: "https://example.com/pricing",
        label: "example.com",
        title: "Pricing",
      },
    ],
    tools: [
      {
        id: "lookup-call",
        name: "lookup_plan",
        payload: {
          input: { planId: "pro" },
          output: { price: 29 },
        },
        state: "completed",
      },
    ],
  })
})
