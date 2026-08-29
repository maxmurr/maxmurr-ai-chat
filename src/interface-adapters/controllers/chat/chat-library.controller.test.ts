import assert from "node:assert/strict";
import { test } from "node:test";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { LibraryService } from "@/src/application/services/library.service.interface";
import type { Chat } from "@/src/entities/models/chat";
import { createChatLibraryController } from "@/src/interface-adapters/controllers/chat/chat-library.controller";

const chat: Chat = {
  createdAt: new Date("2026-08-28T00:00:00.000Z"),
  id: "30000000-0000-4000-8000-000000000001",
  organizationId: "workspace-1",
  ownerId: "user-1",
  pinned: false,
  publicToken: null,
  title: "Files",
  updatedAt: new Date("2026-08-28T00:00:00.000Z"),
  visibility: "private",
};
const fileId = "20000000-0000-4000-8000-000000000001";

function createChatRepository(): ChatRepository {
  return {
    async createChat() {
      return chat;
    },
    async deleteChat() {},
    async deleteMessagesFrom() {},
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
    async listOwnChats() {
      return [];
    },
    async listTeamChats() {
      return [];
    },
    async saveMessage() {},
    async updateChatPinned() {},
    async updateChatSharing() {},
    async updateChatTitle() {},
  };
}

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
