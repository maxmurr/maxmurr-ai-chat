import assert from "node:assert/strict";
import { test } from "node:test";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { ChatStreamStore } from "@/src/application/services/chat-stream-store.service.interface";
import type { Chat, ChatMessage } from "@/src/entities/models/chat";
import type { ChatRequestContext } from "@/src/entities/models/chat-stream-request";
import { createChatStreamLifecycleController } from "@/src/interface-adapters/controllers/chat/chat-stream-lifecycle.controller";

const chatId = "30000000-0000-4000-8000-000000000001";
const streamId = "40000000-0000-4000-8000-000000000001";
const context: ChatRequestContext = {
  organizationId: "workspace-1",
  userDisplayName: "Alex",
  userId: "user-1",
};
const baseChat: Chat = {
  activeStreamId: streamId,
  createdAt: new Date(),
  hasUnreadResponse: false,
  id: chatId,
  organizationId: context.organizationId,
  ownerId: context.userId,
  pinned: false,
  projectId: null,
  publicToken: null,
  title: "Resumable chat",
  updatedAt: new Date(),
  visibility: "private",
};

function createLifecycleFixture(overrides: Partial<Chat> = {}) {
  let chat = { ...baseChat, ...overrides };
  const events: string[] = [];
  const repository = {
    async finishChatResponseStream(
      nextChatId: string,
      nextStreamId: string,
      hasUnreadResponse: boolean
    ) {
      events.push(`finish:${hasUnreadResponse}`);
      if (nextChatId === chat.id && nextStreamId === chat.activeStreamId) {
        chat = { ...chat, activeStreamId: null, hasUnreadResponse };
      }
    },
    async getChatById() {
      return chat;
    },
    async saveMessageIfAbsent(_chatId: string, message: ChatMessage) {
      events.push(`save:${message.id}`);
    },
  } satisfies Pick<
    ChatRepository,
    "finishChatResponseStream" | "getChatById" | "saveMessageIfAbsent"
  >;
  const store: ChatStreamStore = {
    async cancelChatStream(identity) {
      events.push(
        `cancel:${identity.organizationId}:${identity.ownerId}:${identity.chatId}:${identity.streamId}`
      );
    },
    async createChatStream() {},
    async resumeChatStream() {
      return new ReadableStream<string>({
        start(controller) {
          controller.enqueue("data");
          controller.close();
        },
      });
    },
  };

  return {
    controller: createChatStreamLifecycleController(repository, store),
    events,
    setResumeResult(resumeChatStream: ChatStreamStore["resumeChatStream"]) {
      store.resumeChatStream = resumeChatStream;
    },
  };
}

test("chat stream lifecycle resumes and stops matching owner stream in order", async () => {
  const fixture = createLifecycleFixture();
  const resumedStream = await fixture.controller.resumeChatStream(
    chatId,
    context
  );
  assert.ok(resumedStream);
  assert.deepEqual(await resumedStream.getReader().read(), {
    done: false,
    value: "data",
  });

  await fixture.controller.stopChatStream(
    chatId,
    {
      activeStreamId: streamId,
      assistantMessage: {
        id: "assistant-1",
        parts: [{ text: "Partial", type: "text" }],
        role: "assistant",
      },
    },
    context
  );
  assert.deepEqual(fixture.events, [
    "save:assistant-1",
    `cancel:${context.organizationId}:${context.userId}:${chatId}:${streamId}`,
    "finish:false",
  ]);
});

test("stale stop request cannot cancel newer stream", async () => {
  const fixture = createLifecycleFixture();

  await fixture.controller.stopChatStream(
    chatId,
    { activeStreamId: "50000000-0000-4000-8000-000000000001" },
    context
  );

  assert.deepEqual(fixture.events, []);
});

test("stale missing replay state clears persisted activity", async () => {
  const fixture = createLifecycleFixture({
    updatedAt: new Date("2020-01-01T00:00:00.000Z"),
  });
  fixture.setResumeResult(async () => undefined);

  assert.equal(
    await fixture.controller.resumeChatStream(chatId, context),
    null
  );
  assert.deepEqual(fixture.events, ["finish:false"]);
});
