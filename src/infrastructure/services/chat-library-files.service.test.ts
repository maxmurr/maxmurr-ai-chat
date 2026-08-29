import assert from "node:assert/strict";
import { test } from "node:test";

import type { UIMessage } from "ai";

import type { LibraryService } from "@/src/application/services/library.service.interface";
import type { LibraryOwnerScope } from "@/src/entities/models/library";
import { saveAssistantGeneratedFiles } from "@/src/infrastructure/services/chat-library-files.service";

const scope: LibraryOwnerScope = {
  organizationId: "workspace-1",
  ownerId: "user-1",
};
const chatId = "30000000-0000-4000-8000-000000000001";
const folderId = "10000000-0000-4000-8000-000000000001";

test("assistant-generated Files resolve Project Folder lazily and keep Provenance", async () => {
  let resolvedFolderCount = 0;
  let savedInput: unknown;
  let savedFolderId: string | null | undefined;
  const libraryService = {
    async saveGeneratedFiles(
      input: unknown,
      _scope: LibraryOwnerScope,
      targetFolderId?: string | null
    ) {
      savedInput = input;
      savedFolderId = targetFolderId;
      return [
        {
          ...scope,
          createdAt: new Date("2026-08-30T00:00:00.000Z"),
          folderId: targetFolderId ?? null,
          id: "20000000-0000-4000-8000-000000000001",
          mediaType: "text/plain",
          name: "result.txt",
          provenanceChatId: chatId,
          provenanceChatTitle: null,
          provenanceMessageId: "assistant-message",
          size: 6,
        },
      ];
    },
  } as unknown as LibraryService;
  const resolveChatFileFolderId = async () => {
    resolvedFolderCount += 1;
    return folderId;
  };
  const generatedMessage = {
    id: "assistant-message",
    parts: [
      {
        filename: "result.txt",
        mediaType: "text/plain",
        type: "file",
        url: "data:text/plain;base64,cmVzdWx0",
      },
    ],
    role: "assistant",
  } satisfies UIMessage;

  const savedMessage = await saveAssistantGeneratedFiles(
    generatedMessage,
    chatId,
    libraryService,
    resolveChatFileFolderId,
    scope
  );

  assert.equal(resolvedFolderCount, 1);
  assert.equal(savedFolderId, folderId);
  assert.deepEqual(savedInput, [
    {
      bytes: new TextEncoder().encode("result"),
      mediaType: "text/plain",
      name: "result.txt",
      provenanceChatId: chatId,
      provenanceMessageId: "assistant-message",
    },
  ]);
  assert.equal(
    savedMessage.parts[0].type === "file" ? savedMessage.parts[0].url : null,
    "/api/library/files/20000000-0000-4000-8000-000000000001"
  );

  await saveAssistantGeneratedFiles(
    {
      id: "text-only",
      parts: [{ text: "done", type: "text" }],
      role: "assistant",
    },
    chatId,
    libraryService,
    resolveChatFileFolderId,
    scope
  );
  assert.equal(resolvedFolderCount, 1);
});
