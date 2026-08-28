import assert from "node:assert/strict"
import { test } from "node:test"

import {
  convertChatUiMessageToDisplayMessage,
  type ChatUIMessage,
} from "@/src/interface-adapters/presenters/chat-message.presenter"

test("streamed AI SDK parts map to chat reasoning, tools, files, and sources", () => {
  const message: ChatUIMessage = {
    id: "assistant-response",
    metadata: { createdAt: "2026-08-28T01:02:03.000Z" },
    role: "assistant",
    parts: [
      {
        type: "reasoning",
        state: "done",
        text: "Checked current plan.",
      },
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
    createdAt: "2026-08-28T01:02:03.000Z",
    id: "assistant-response",
    reasoning: {
      state: "completed",
      text: "Checked current plan.",
    },
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

test("streaming reasoning maps to running chat activity", () => {
  const message: ChatUIMessage = {
    id: "assistant-response",
    role: "assistant",
    parts: [
      {
        type: "reasoning",
        state: "streaming",
        text: "Checking current plan.",
      },
    ],
  }

  assert.deepEqual(convertChatUiMessageToDisplayMessage(message)?.reasoning, {
    state: "running",
    text: "Checking current plan.",
  })
})

test("finished reasoning without text is omitted from display", () => {
  const message: ChatUIMessage = {
    id: "assistant-response",
    role: "assistant",
    parts: [
      { type: "reasoning", state: "done", text: "" },
      { type: "text", text: "pong" },
    ],
  }

  const displayMessage = convertChatUiMessageToDisplayMessage(message)

  assert.equal(displayMessage?.reasoning, undefined)
  assert.equal(displayMessage?.content, "pong")
})

test("empty streaming reasoning still shows running activity", () => {
  const message: ChatUIMessage = {
    id: "assistant-response",
    role: "assistant",
    parts: [{ type: "reasoning", state: "streaming", text: "" }],
  }

  assert.deepEqual(convertChatUiMessageToDisplayMessage(message)?.reasoning, {
    state: "running",
    text: "",
  })
})

test("AI SDK 7 denied tool output maps to failed chat activity", () => {
  const message: ChatUIMessage = {
    id: "assistant-response",
    role: "assistant",
    parts: [
      {
        approval: {
          approved: false,
          id: "approval-request",
          reason: "User declined.",
        },
        input: { planId: "pro" },
        state: "output-denied",
        toolCallId: "lookup-call",
        toolName: "lookup_plan",
        type: "dynamic-tool",
      },
    ],
  }

  assert.deepEqual(convertChatUiMessageToDisplayMessage(message)?.tools, [
    {
      id: "lookup-call",
      name: "lookup_plan",
      payload: {
        error: "User declined.",
        input: { planId: "pro" },
      },
      state: "failed",
    },
  ])
})
