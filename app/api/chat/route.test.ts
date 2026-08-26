import assert from "node:assert/strict"
import { test } from "node:test"

import { parseChatApiRequest } from "@/app/api/chat/route"

test("chat API request parser accepts AI SDK messages and rejects malformed input", () => {
  const validRequest = {
    messages: [
      {
        id: "user-message",
        metadata: { createdAt: "2026-08-26T00:00:00.000Z" },
        role: "user" as const,
        parts: [
          {
            providerMetadata: { test: { traceId: "trace-1" } },
            type: "text",
            text: "Hello",
          },
        ],
      },
    ],
    trigger: "submit-message" as const,
  }

  assert.deepEqual(parseChatApiRequest(validRequest), validRequest)
  assert.equal(parseChatApiRequest({ messages: [] }), null)
  assert.equal(
    parseChatApiRequest({
      messages: [
        {
          id: "user-message",
          role: "owner",
          parts: [{ type: "text", text: "Hello" }],
        },
      ],
    }),
    null
  )
  assert.equal(
    parseChatApiRequest({
      messages: [
        {
          id: "user-message",
          role: "user",
          parts: [{ type: "text" }],
        },
      ],
    }),
    null
  )
})
