import assert from "node:assert/strict";
import { test } from "node:test";

import type { AgentControllerEvent } from "@mastra/core/agent-controller";
import type {
  ChannelHandler,
  ChannelSessionStart,
} from "@mastra/core/channels";
import { z } from "zod";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { Chat, ChatMessage } from "@/src/entities/models/chat";
import {
  chatIdForSlackThread,
  createSlackChatLink,
} from "@/src/infrastructure/ai/mastra/slack-chat-link";

const SLACK_THREAD_ID = "slack:C1:1788359871.262209";
const createdAt = new Date("2026-09-02T00:00:00.000Z");

function createFixture(options: { activeStreamId?: string | null } = {}) {
  const chats = new Map<string, Chat>();
  const messages: { chatId: string; message: ChatMessage }[] = [];
  const finished: { hasUnreadResponse: boolean; streamId: string }[] = [];
  const posts: unknown[] = [];
  let defaultHandlerCalls = 0;
  const chatRepository = {
    async claimChatResponseStream(chatId: string, streamId: string) {
      const chat = chats.get(chatId);
      if (!chat || chat.activeStreamId !== null) return false;
      chats.set(chatId, { ...chat, activeStreamId: streamId });
      return true;
    },
    async createChat(newChat: Parameters<ChatRepository["createChat"]>[0]) {
      const chat: Chat = {
        ...newChat,
        activeStreamId: options.activeStreamId ?? null,
        createdAt,
        hasUnreadResponse: false,
        pinned: false,
        publicToken: null,
        updatedAt: new Date(),
        visibility: "private",
      };
      chats.set(chat.id, chat);
      return chat;
    },
    async findWorkspaceMemberByEmail(email: string, organizationId?: string) {
      if (email !== "member@example.com") return null;
      return {
        organizationId: organizationId ?? "workspace-1",
        userAvatarUrl: "https://example.com/sam.png",
        userDisplayName: "Sam",
        userId: "user-1",
      };
    },
    async finishChatResponseStream(
      _chatId: string,
      streamId: string,
      hasUnreadResponse: boolean
    ) {
      finished.push({ hasUnreadResponse, streamId });
    },
    async getChatById(chatId: string) {
      return chats.get(chatId) ?? null;
    },
    async saveMessage(chatId: string, message: ChatMessage) {
      messages.push({ chatId, message });
    },
    async saveMessageIfAbsent(chatId: string, message: ChatMessage) {
      messages.push({ chatId, message });
    },
  } as unknown as ChatRepository;
  const link = createSlackChatLink(chatRepository);
  const thread = {
    id: SLACK_THREAD_ID,
    isDM: true,
    async post(message: unknown) {
      posts.push(message);
    },
  } as unknown as Parameters<ChannelHandler>[0];

  function slackMessage(
    email: string | undefined,
    text = "<@U0BUG911T7C> Hello from Slack"
  ) {
    return {
      attachments: [],
      author: { email, fullName: "Sam Slack", userId: "U1" },
      id: "1788359871.262209",
      isMention: false,
      metadata: { dateSent: createdAt },
      text,
    } as unknown as Parameters<ChannelHandler>[1];
  }

  return {
    chats,
    defaultHandlerCalls: () => defaultHandlerCalls,
    finished,
    link,
    messages,
    posts,
    async receive(email: string | undefined) {
      await link.handleMessage(
        thread,
        slackMessage(email),
        async () => {
          defaultHandlerCalls += 1;
        },
        { requestContext: {} as never, signalMetadata: {} }
      );
    },
    startSession(chatId: string) {
      const listeners: ((event: AgentControllerEvent) => void)[] = [];
      link.onSessionStart({
        session: {
          subscribe(listener: (event: AgentControllerEvent) => void) {
            listeners.push(listener);
            return () => {};
          },
        } as unknown as Parameters<ChannelSessionStart>[0]["session"],
        thread: { id: chatId, resourceId: `channel:${SLACK_THREAD_ID}` },
      });
      return async (event: AgentControllerEvent) => {
        for (const listener of listeners) listener(event);
        await new Promise((resolve) => setTimeout(resolve, 0));
      };
    },
  };
}

function assistantEvent(): AgentControllerEvent {
  return {
    message: {
      content: {
        format: 2,
        parts: [{ text: "Hi from the assistant", type: "text" }],
      },
      createdAt,
      id: "assistant-1",
      role: "assistant",
    },
    type: "message_end",
  } as unknown as AgentControllerEvent;
}

test("Slack thread id derives one stable UUID Chat id", () => {
  const chatId = chatIdForSlackThread(SLACK_THREAD_ID);

  assert.equal(chatId, chatIdForSlackThread(SLACK_THREAD_ID));
  assert.notEqual(chatId, chatIdForSlackThread("slack:C1:other"));
  assert.ok(z.uuid().safeParse(chatId).success);
  assert.equal(chatId, link_resolveThreadId());
});

function link_resolveThreadId() {
  return createSlackChatLink({} as ChatRepository).resolveThreadId({
    defaultThreadId: "ignored",
    message: {} as never,
    platform: "slack",
    resourceId: "ignored",
    thread: { id: SLACK_THREAD_ID } as never,
  });
}

test("Slack author without a Workspace membership gets a sign-in hint and no Chat", async () => {
  const fixture = createFixture();

  await fixture.receive("stranger@example.com");

  assert.equal(fixture.posts.length, 1);
  assert.equal(fixture.chats.size, 0);
  assert.equal(fixture.defaultHandlerCalls(), 0);
});

test("Workspace member Slack message creates the linked Chat and mirrors both turns", async () => {
  const fixture = createFixture();
  const chatId = chatIdForSlackThread(SLACK_THREAD_ID);
  const emit = fixture.startSession(chatId);

  await fixture.receive("member@example.com");

  const chat = fixture.chats.get(chatId);
  assert.equal(chat?.ownerId, "user-1");
  assert.equal(chat?.organizationId, "workspace-1");
  assert.equal(chat?.title, "Hello from Slack");
  assert.deepEqual(fixture.messages[0].message.parts, [
    { text: "Hello from Slack", type: "text" },
  ]);
  assert.deepEqual(fixture.messages[0].message.metadata, {
    createdAt: createdAt.toISOString(),
    sender: {
      avatarUrl: "https://example.com/sam.png",
      displayName: "Sam",
      userId: "user-1",
    },
  });
  assert.ok(chat?.activeStreamId);
  assert.equal(fixture.defaultHandlerCalls(), 1);
  assert.deepEqual(
    fixture.messages.map(({ message }) => message.role),
    ["user"]
  );

  await emit(assistantEvent());
  await emit({ reason: "complete", type: "agent_end" });

  assert.deepEqual(
    fixture.messages.map(({ message }) => message.role),
    ["user", "assistant"]
  );
  assert.deepEqual(fixture.messages[1].message.parts, [
    { text: "Hi from the assistant", type: "text" },
  ]);
  assert.deepEqual(fixture.finished, [
    { hasUnreadResponse: true, streamId: chat!.activeStreamId! },
  ]);
});

test("Slack run never mirrors while the web holds the Chat stream", async () => {
  const fixture = createFixture({ activeStreamId: "web-stream" });
  const chatId = chatIdForSlackThread(SLACK_THREAD_ID);
  const emit = fixture.startSession(chatId);

  await fixture.receive("member@example.com");
  await emit(assistantEvent());
  await emit({ reason: "complete", type: "agent_end" });

  assert.deepEqual(
    fixture.messages.map(({ message }) => message.role),
    ["user"]
  );
  assert.deepEqual(fixture.finished, []);
});
