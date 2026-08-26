import assert from "node:assert/strict"
import { test } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

import { ChatMessageItem } from "@/components/chat/chat-message"
import { MessageScrollerProvider } from "@/components/ui/message-scroller"
import { TooltipProvider } from "@/components/ui/tooltip"

test("chat message composes reasoning, tools, files, sources, and actions", () => {
  const markup = renderToStaticMarkup(
    <TooltipProvider>
      <MessageScrollerProvider>
        <ChatMessageItem
          copyResult={null}
          isGenerating={false}
          isStreaming={false}
          message={{
            attachments: [
              { filename: "report.pdf", mediaType: "application/pdf" },
            ],
            content: "Finished",
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
          }}
          onCopyMessage={() => {}}
          onRetryMessage={() => {}}
        />
      </MessageScrollerProvider>
    </TooltipProvider>
  )

  for (const text of [
    "Reasoning",
    "Search",
    "report.pdf",
    "Finished",
    "1 sources",
    "Regenerate response",
  ]) {
    assert.match(markup, new RegExp(text))
  }
})
