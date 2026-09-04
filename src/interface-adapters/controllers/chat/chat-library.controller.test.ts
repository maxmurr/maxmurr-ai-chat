import assert from "node:assert/strict";
import { test } from "node:test";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { LibraryService } from "@/src/application/services/library.service.interface";
import {
  ChatAccessDeniedError,
  ChatStreamConflictError,
  InvalidChatRequestError,
} from "@/src/entities/errors/chat-errors";
import type { Chat } from "@/src/entities/models/chat";
import { createChatLibraryController } from "@/src/interface-adapters/controllers/chat/chat-library.controller";

const chat: Chat = {
  activeStreamId: null,
  createdAt: new Date("2026-08-28T00:00:00.000Z"),
  hasUnreadResponse: false,
  id: "30000000-0000-4000-8000-000000000001",
  organizationId: "workspace-1",
  ownerId: "user-1",
  pinned: false,
  projectId: "10000000-0000-4000-8000-000000000001",
  publicToken: null,
  title: "Files",
  updatedAt: new Date("2026-08-28T00:00:00.000Z"),
  visibility: "workspace",
};
const fileId = "20000000-0000-4000-8000-000000000001";

function createChatRepository(): ChatRepository {
  return {
    async claimChatResponseStream() {
      return true;
    },
    async createChat() {
      return chat;
    },
    async deleteChat() {
      return true;
    },
    async deleteOwnedChats(chatIds) {
      return [...chatIds];
    },
    async deleteMessagesFrom() {},
    async findWorkspaceMemberByEmail() {
      return null;
    },
    async finishChatResponseStream() {},
    async getChatById() {
      return chat;
    },
    async getChatByPublicToken() {
      return null;
    },
    async getChatMessages() {
      return [
        {
          id: "message-1",
          parts: [
            {
              filename: "brief.pdf",
              mediaType: "application/pdf",
              type: "file",
              url: `/api/library/files/${fileId}`,
            },
          ],
          role: "user",
        },
        {
          id: "assistant-message",
          metadata: {
            langfuseTraceId: "0123456789abcdef0123456789abcdef",
          },
          parts: [{ text: "Done", type: "text" }],
          role: "assistant",
        },
      ];
    },
    async isWorkspaceMember() {
      return true;
    },
    async listChatsByProject() {
      return [];
    },
    async listOwnChats() {
      return [];
    },
    async listOwnChatsPage() {
      return { chats: [], nextCursor: null };
    },
    async listTeamChats() {
      return [];
    },
    async markChatRead() {},
    async saveMessage() {},
    async saveMessageIfAbsent() {},
    async updateChatPinned() {},
    async updateChatProject() {},
    async updateChatSharing() {},
    async updateChatTitle() {},
  };
}

test("active Chat cannot be deleted before its response stops", async () => {
  const repository = createChatRepository();
  repository.getChatById = async () => ({
    ...chat,
    activeStreamId: "40000000-0000-4000-8000-000000000001",
  });
  repository.deleteChat = async () => false;
  const controller = createChatLibraryController(repository, {
    async findExistingFileIds() {
      return [];
    },
  } as unknown as LibraryService);

  await assert.rejects(
    controller.deleteChat(chat.id, chat.ownerId),
    ChatStreamConflictError
  );
});

test("Chat owner sees File availability and resolves assistant feedback trace", async () => {
  const libraryService = {
    async findExistingFileIds() {
      return [];
    },
  } as unknown as LibraryService;
  const controller = createChatLibraryController(
    createChatRepository(),
    libraryService
  );

  const view = await controller.getChatForViewer(
    chat.id,
    chat.ownerId,
    chat.organizationId
  );

  assert.deepEqual(view?.messages[0].metadata, {
    libraryFileAvailability: { [fileId]: false },
  });
  assert.equal(view?.chat.projectId, chat.projectId);
  assert.equal(
    (
      await controller.getChatForViewer(
        chat.id,
        "workspace-member",
        chat.organizationId
      )
    )?.chat.projectId,
    null
  );
  assert.equal(
    await controller.getChatForViewer(chat.id, chat.ownerId, "workspace-2"),
    null
  );
  assert.equal(
    await controller.getOwnedAssistantMessageLangfuseTraceId(
      chat.id,
      chat.ownerId,
      "assistant-message"
    ),
    "0123456789abcdef0123456789abcdef"
  );
});

test("public Chat continuation reopens ownership or copies safe history", async () => {
  const repository = createChatRepository();
  const publicChat = {
    ...chat,
    organizationId: "source-workspace",
    ownerId: "source-owner",
    projectId: "10000000-0000-4000-8000-000000000002",
    publicToken: "public-token",
    visibility: "public" as const,
  };
  const sourceMessages = [
    {
      id: "assistant-message",
      metadata: {
        createdAt: "2026-08-28T00:00:00.000Z",
        langfuseTraceId: "0123456789abcdef0123456789abcdef",
        libraryFileAvailability: { [fileId]: false },
      },
      parts: [{ text: "Shared answer", type: "text" }],
      role: "assistant" as const,
    },
  ];
  let copiedInput: Parameters<ChatRepository["createChat"]>[0] | undefined;
  let copiedMessages: Parameters<ChatRepository["createChat"]>[1];
  let createCount = 0;
  repository.getChatByPublicToken = async (publicToken) =>
    publicToken === publicChat.publicToken ? publicChat : null;
  repository.getChatMessages = async () => sourceMessages;
  repository.createChat = async (input, initialMessages) => {
    createCount += 1;
    copiedInput = input;
    copiedMessages = initialMessages;
    return {
      ...publicChat,
      ...input,
      publicToken: null,
      visibility: "private",
    };
  };
  const controller = createChatLibraryController(repository, {
    async findExistingFileIds() {
      return [];
    },
  } as unknown as LibraryService);
  const targetScope = {
    organizationId: "target-workspace",
    ownerId: "target-owner",
  };

  const continuedChat = await controller.continuePublicChat(
    "public-token",
    targetScope
  );

  assert.equal(continuedChat.ownerId, targetScope.ownerId);
  assert.equal(copiedInput?.organizationId, targetScope.organizationId);
  assert.equal(copiedInput?.projectId, null);
  assert.deepEqual(copiedMessages, [
    {
      ...sourceMessages[0],
      metadata: { createdAt: "2026-08-28T00:00:00.000Z" },
    },
  ]);
  assert.equal(
    (
      await controller.continuePublicChat("public-token", {
        organizationId: publicChat.organizationId,
        ownerId: publicChat.ownerId,
      })
    ).id,
    publicChat.id
  );
  assert.equal(createCount, 1);
  await assert.rejects(
    controller.continuePublicChat("revoked-token", targetScope),
    ChatAccessDeniedError
  );
});

test("bulk Chat deletion stays owner-scoped and reports blocked rows", async () => {
  const repository = createChatRepository();
  const secondChatId = "30000000-0000-4000-8000-000000000002";
  repository.deleteOwnedChats = async (chatIds, scope) => {
    assert.deepEqual(chatIds, [chat.id, secondChatId]);
    assert.deepEqual(scope, {
      organizationId: chat.organizationId,
      ownerId: chat.ownerId,
    });
    return [chat.id];
  };
  const controller = createChatLibraryController(repository, {
    async findExistingFileIds() {
      return [];
    },
  } as unknown as LibraryService);

  assert.deepEqual(
    await controller.deleteOwnedChats([chat.id, secondChatId], {
      organizationId: chat.organizationId,
      ownerId: chat.ownerId,
    }),
    { blockedChatIds: [secondChatId], deletedChatIds: [chat.id] }
  );
});

test("Chat list validates cursor requests before persistence", async () => {
  const controller = createChatLibraryController(createChatRepository(), {
    async findExistingFileIds() {
      return [];
    },
  } as unknown as LibraryService);

  await assert.rejects(
    controller.listOwnChatsPage(
      {
        cursor: { id: "not-a-chat-id", updatedAt: new Date() },
        filter: "all",
        limit: 30,
        query: "",
      },
      { organizationId: chat.organizationId, ownerId: chat.ownerId }
    ),
    InvalidChatRequestError
  );
});
