import assert from "node:assert/strict";
import { test } from "node:test";

import {
  convertChatUiMessageToDisplayMessage,
  type ChatUIMessage,
} from "@/src/interface-adapters/presenters/chat-message.presenter";

test("streamed AI SDK parts map to chat reasoning, tools, files, and sources", () => {
  const message: ChatUIMessage = {
    id: "assistant-response",
    metadata: {
      createdAt: "2026-08-28T01:02:03.000Z",
      langfuseTraceId: "0123456789abcdef0123456789abcdef",
    },
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
  };

  assert.deepEqual(convertChatUiMessageToDisplayMessage(message), {
    attachments: [
      {
        filename: "quote.pdf",
        href: "data:application/pdf;base64,AA==",
        id: "assistant-response-file-4",
        isAvailable: true,
        mediaType: "application/pdf",
      },
    ],
    content: "Pro costs $29.",
    createdAt: "2026-08-28T01:02:03.000Z",
    feedbackEnabled: true,
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
  });
});

test("Gateway web search uses sources UI instead of generic tool UI", () => {
  const message: ChatUIMessage = {
    id: "assistant-response",
    role: "assistant",
    parts: [
      {
        type: "tool-webSearch",
        toolCallId: "web-search-call",
        state: "output-available",
        input: { query: "latest AI news" },
        output: {
          requestId: "request-1",
          results: [
            {
              id: "result-1",
              title: "AI update",
              url: "https://example.com/ai-update",
            },
            {
              id: "result-2",
              title: "Unsafe result",
              url: "javascript:alert(1)",
            },
          ],
        },
      },
      {
        type: "tool-webSearch",
        toolCallId: "web-search-call-2",
        state: "output-available",
        input: { query: "AI news today" },
        output: {
          requestId: "request-2",
          results: [
            {
              id: "result-3",
              title: "Duplicate AI update",
              url: "https://example.com/ai-update",
            },
          ],
        },
      },
      {
        type: "tool-webSearch",
        toolCallId: "web-search-call-3",
        state: "input-available",
        input: { query: "AI announcements" },
      },
      {
        type: "tool-webSearch",
        toolCallId: "web-search-call-4",
        state: "output-error",
        input: { query: "AI reports" },
        errorText: "Search failed",
      },
      { type: "text", text: "Latest update." },
    ],
  };

  const displayMessage = convertChatUiMessageToDisplayMessage(message);

  assert.deepEqual(
    {
      sources: displayMessage?.sources,
      tools: displayMessage?.tools,
      webSearches: displayMessage?.webSearches,
    },
    {
      sources: [
        {
          href: "https://example.com/ai-update",
          label: "example.com",
          title: "AI update",
        },
      ],
      tools: undefined,
      webSearches: [
        {
          id: "web-search-call",
          query: "latest AI news",
          status: "searched",
        },
        {
          id: "web-search-call-2",
          query: "AI news today",
          status: "searched",
        },
        {
          id: "web-search-call-3",
          query: "AI announcements",
          status: "searching",
        },
        {
          id: "web-search-call-4",
          query: "AI reports",
          status: "failed",
        },
      ],
    }
  );
});

test("deleted Library File maps to unavailable Chat placeholder", () => {
  const fileId = "20000000-0000-4000-8000-000000000001";
  const message: ChatUIMessage = {
    id: "user-message",
    metadata: { libraryFileAvailability: { [fileId]: false } },
    role: "user",
    parts: [
      {
        filename: "brief.pdf",
        mediaType: "application/pdf",
        type: "file",
        url: `/api/library/files/${fileId}`,
      },
    ],
  };

  assert.deepEqual(convertChatUiMessageToDisplayMessage(message)?.attachments, [
    {
      filename: "brief.pdf",
      id: fileId,
      isAvailable: false,
      mediaType: "application/pdf",
    },
  ]);
});

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
  };

  assert.deepEqual(convertChatUiMessageToDisplayMessage(message)?.reasoning, {
    state: "running",
    text: "Checking current plan.",
  });
});

test("finished reasoning without text is omitted from display", () => {
  const message: ChatUIMessage = {
    id: "assistant-response",
    role: "assistant",
    parts: [
      { type: "reasoning", state: "done", text: "" },
      { type: "text", text: "pong" },
    ],
  };

  const displayMessage = convertChatUiMessageToDisplayMessage(message);

  assert.equal(displayMessage?.reasoning, undefined);
  assert.equal(displayMessage?.content, "pong");
});

test("empty streaming reasoning still shows running activity", () => {
  const message: ChatUIMessage = {
    id: "assistant-response",
    role: "assistant",
    parts: [{ type: "reasoning", state: "streaming", text: "" }],
  };

  assert.deepEqual(convertChatUiMessageToDisplayMessage(message)?.reasoning, {
    state: "running",
    text: "",
  });
});

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
  };

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
  ]);
});
