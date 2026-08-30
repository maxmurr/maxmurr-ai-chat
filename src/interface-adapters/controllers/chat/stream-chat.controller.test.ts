import assert from "node:assert/strict";
import { test } from "node:test";

import { InvalidChatRequestError } from "@/src/entities/errors/chat-errors";
import type {
  ChatRequestContext,
  ChatStreamRequest,
} from "@/src/entities/models/chat-stream-request";
import { createStreamChatController } from "@/src/interface-adapters/controllers/chat/stream-chat.controller";

test("chat controller validates input before streaming", async () => {
  const chatId = "6f1f429e-84f3-4a10-9f2c-58a1a7a8f001";
  const streamId = "8f1f429e-84f3-4a10-9f2c-58a1a7a8f003";
  const validMessage = {
    id: "user-message",
    metadata: { createdAt: "2026-08-26T00:00:00.000Z" },
    role: "user" as const,
    parts: [
      {
        providerMetadata: { test: { traceId: "trace-1" } },
        type: "text",
        text: "Hello",
      },
      {
        filename: "brief.pdf",
        mediaType: "application/pdf",
        type: "file",
        url: "/api/library/files/20000000-0000-4000-8000-000000000001",
      },
    ],
  };
  const modelId = "anthropic/claude-opus-5";
  const projectId = "7f1f429e-84f3-4a10-9f2c-58a1a7a8f002";
  const validRequest = {
    id: chatId,
    message: validMessage,
    modelId,
    projectId,
    streamId,
    trigger: "submit-message" as const,
  };
  const context: ChatRequestContext = {
    organizationId: "workspace-1",
    userId: "user-1",
  };
  const expectedResponse = new Response("stream");
  let receivedRequest: ChatStreamRequest | undefined;
  const controller = createStreamChatController(async (request) => {
    receivedRequest = request;
    return expectedResponse;
  });
  assert.equal(await controller(validRequest, context), expectedResponse);
  assert.deepEqual(receivedRequest, {
    chatId,
    message: validMessage,
    messageId: undefined,
    modelId,
    projectId,
    streamId,
    trigger: "submit-message",
  });

  assert.throws(
    () =>
      controller(
        { id: "not-a-uuid", message: validMessage, modelId, streamId },
        context
      ),
    InvalidChatRequestError
  );
  assert.throws(
    () => controller({ id: chatId, message: validMessage, modelId }, context),
    InvalidChatRequestError
  );
  assert.throws(
    () =>
      controller(
        {
          id: chatId,
          message: {
            id: "user-message",
            role: "assistant",
            parts: [{ type: "text", text: "Hello" }],
          },
          modelId,
          streamId,
        },
        context
      ),
    InvalidChatRequestError
  );
  assert.throws(
    () =>
      controller(
        {
          id: chatId,
          message: {
            id: "user-message",
            role: "user",
            parts: [{ type: "text" }],
          },
          modelId,
          streamId,
        },
        context
      ),
    InvalidChatRequestError
  );
  assert.throws(
    () =>
      controller(
        {
          id: chatId,
          message: validMessage,
          modelId,
          projectId: "not-a-uuid",
          streamId,
        },
        context
      ),
    InvalidChatRequestError
  );
  assert.throws(
    () =>
      controller(
        {
          id: chatId,
          message: {
            id: "user-message",
            role: "user",
            parts: [
              {
                filename: "brief.pdf",
                mediaType: "application/pdf",
                type: "file",
                url: "https://example.com/brief.pdf",
              },
            ],
          },
          modelId,
          streamId,
        },
        context
      ),
    InvalidChatRequestError
  );
  assert.throws(
    () =>
      controller(
        {
          id: chatId,
          message: validMessage,
          modelId: "openai/not-approved",
          streamId,
        },
        context
      ),
    InvalidChatRequestError
  );
});
