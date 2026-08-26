import assert from "node:assert/strict"
import { test } from "node:test"

import { InvalidChatRequestError } from "@/src/entities/errors/chat-errors"
import type { ChatStreamRequest } from "@/src/entities/models/chat-stream-request"
import { createStreamChatController } from "@/src/interface-adapters/controllers/chat/stream-chat.controller"

test("chat controller validates input before streaming", async () => {
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
  const expectedResponse = new Response("stream")
  let receivedRequest: ChatStreamRequest | undefined
  const controller = createStreamChatController(async (request) => {
    receivedRequest = request
    return expectedResponse
  })
  const abortSignal = new AbortController().signal

  assert.equal(await controller(validRequest, abortSignal), expectedResponse)
  assert.deepEqual(receivedRequest, validRequest)

  assert.throws(
    () => controller({ messages: [] }, abortSignal),
    InvalidChatRequestError
  )
  assert.throws(
    () =>
      controller(
        {
          messages: [
            {
              id: "user-message",
              role: "owner",
              parts: [{ type: "text", text: "Hello" }],
            },
          ],
        },
        abortSignal
      ),
    InvalidChatRequestError
  )
  assert.throws(
    () =>
      controller(
        {
          messages: [
            {
              id: "user-message",
              role: "user",
              parts: [{ type: "text" }],
            },
          ],
        },
        abortSignal
      ),
    InvalidChatRequestError
  )
})
