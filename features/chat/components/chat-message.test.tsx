import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ChatMessageItem } from "@/features/chat/components/chat-message";
import { MessageScrollerProvider } from "@/components/ui/message-scroller";
import { TooltipProvider } from "@/components/ui/tooltip";

test("chat message composes reasoning, tools, files, sources, and actions", () => {
  const markup = renderToStaticMarkup(
    <TooltipProvider>
      <MessageScrollerProvider>
        <ChatMessageItem
          copyResult={null}
          feedbackChatId="30000000-0000-4000-8000-000000000001"
          isGenerating={false}
          isStreaming={false}
          message={{
            attachments: [
              {
                filename: "report.pdf",
                href: "/api/library/files/file-1",
                id: "file-1",
                isAvailable: true,
                mediaType: "application/pdf",
              },
            ],
            content: "Finished",
            createdAt: "2026-08-28T01:02:03.000Z",
            feedbackEnabled: true,
            id: "message-1",
            reasoning: { state: "completed", text: "Checked inputs" },
            role: "assistant",
            sources: [
              {
                href: "https://example.com/source",
                label: "example.com",
                title: "Source",
              },
            ],
            tools: [
              {
                id: "tool-1",
                name: "Search",
                payload: { query: "status" },
                state: "completed",
              },
            ],
            webSearches: [
              {
                id: "search-1",
                query: "current Stripe Billing pricing and fees",
                status: "searching",
              },
              {
                id: "search-2",
                query: "Stripe Billing pricing",
                status: "searched",
              },
              {
                id: "search-3",
                query: "Stripe Billing volume discounts",
                status: "failed",
              },
            ],
          }}
          onCopyMessage={() => {}}
          onRetryMessage={() => {}}
        />
      </MessageScrollerProvider>
    </TooltipProvider>
  );

  for (const text of [
    "Reasoning",
    "Search",
    "Searching the web for current Stripe Billing pricing and fees",
    "Searched the web for Stripe Billing pricing",
    "Web search failed",
    "report.pdf",
    "Finished",
    "1 sources",
    "Good response",
    "Bad response",
    "Regenerate response",
  ]) {
    assert.match(markup, new RegExp(text));
  }
});

test("inactive chat message does not show stale reasoning as running", () => {
  const markup = renderToStaticMarkup(
    <TooltipProvider>
      <MessageScrollerProvider>
        <ChatMessageItem
          copyResult={null}
          isGenerating={false}
          isStreaming={false}
          message={{
            content: "Partial response",
            createdAt: "2026-09-04T07:03:00.000Z",
            id: "aborted-response",
            reasoning: { state: "running", text: "Partial reasoning" },
            role: "assistant",
          }}
          onCopyMessage={() => {}}
          onRetryMessage={() => {}}
        />
      </MessageScrollerProvider>
    </TooltipProvider>
  );

  assert.doesNotMatch(markup, /aria-busy="true"/);
  assert.doesNotMatch(markup, /Reasoning\.\.\./);
  assert.match(markup, />Reasoning</);
});

test("user chat message offers prompt editing", () => {
  const markup = renderToStaticMarkup(
    <TooltipProvider>
      <MessageScrollerProvider>
        <ChatMessageItem
          copyResult={null}
          isGenerating={false}
          isStreaming={false}
          message={{
            content: "Original prompt",
            createdAt: "2026-08-28T01:02:03.000Z",
            id: "message-1",
            role: "user",
          }}
          onCopyMessage={() => {}}
          onEditMessage={() => {}}
        />
      </MessageScrollerProvider>
    </TooltipProvider>
  );

  assert.match(markup, /aria-label="Edit message"/);
});
