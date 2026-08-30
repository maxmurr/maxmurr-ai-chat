import assert from "node:assert/strict";
import { test } from "node:test";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { LibraryService } from "@/src/application/services/library.service.interface";
import { ChatStreamConflictError } from "@/src/entities/errors/chat-errors";
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
    async deleteMessagesFrom() {},
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
