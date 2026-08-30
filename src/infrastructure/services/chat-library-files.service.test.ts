import assert from "node:assert/strict";
import { test } from "node:test";

import type { UIMessage } from "ai";

import type { LibraryService } from "@/src/application/services/library.service.interface";
import {
  createLibraryFileDownloadUrl,
  type LibraryOwnerScope,
} from "@/src/entities/models/library";
import {
  hydrateLibraryFilesForModel,
  saveAssistantGeneratedFiles,
} from "@/src/infrastructure/services/chat-library-files.service";

const scope: LibraryOwnerScope = {
  organizationId: "workspace-1",
  ownerId: "user-1",
};
const chatId = "30000000-0000-4000-8000-000000000001";
const folderId = "10000000-0000-4000-8000-000000000001";

test("model File hydration deduplicates bounded parallel downloads", async () => {
  const fileIds = Array.from(
    { length: 5 },
    (_, index) => `20000000-0000-4000-8000-00000000000${index + 1}`
  );
  let activeDownloads = 0;
  let downloadCount = 0;
  let maxActiveDownloads = 0;
  const libraryService = {
    async downloadFile(fileId: string) {
      activeDownloads += 1;
      downloadCount += 1;
      maxActiveDownloads = Math.max(maxActiveDownloads, activeDownloads);
      await Promise.resolve();
      activeDownloads -= 1;
      return {
        ...scope,
        bytes: new TextEncoder().encode(fileId),
        createdAt: new Date("2026-08-30T00:00:00.000Z"),
        folderId: null,
        id: fileId,
        mediaType: "text/plain",
        name: `${fileId}.txt`,
        provenanceChatId: null,
        provenanceChatTitle: null,
        provenanceMessageId: null,
        size: fileId.length,
      };
    },
  } as unknown as LibraryService;
  const fileParts = [...fileIds, fileIds[0]].map((fileId) => ({
    filename: `${fileId}.txt`,
    mediaType: "text/plain",
    type: "file" as const,
    url: createLibraryFileDownloadUrl(fileId),
  }));

  const [hydratedMessage] = await hydrateLibraryFilesForModel(
    [{ id: "message-1", parts: fileParts, role: "user" }],
    libraryService,
    scope
  );

  assert.equal(downloadCount, fileIds.length);
  assert.equal(maxActiveDownloads, 4);
  assert.equal(
    hydratedMessage.parts.filter((part) => part.type === "file").length,
    fileParts.length
  );
});

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

  const savedResult = await saveAssistantGeneratedFiles(
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
    savedResult.message.parts[0].type === "file"
      ? savedResult.message.parts[0].url
      : null,
    "/api/library/files/20000000-0000-4000-8000-000000000001"
  );
  assert.deepEqual(savedResult.savedFileIds, [
    "20000000-0000-4000-8000-000000000001",
  ]);

  const textOnlyResult = await saveAssistantGeneratedFiles(
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
  assert.deepEqual(textOnlyResult.savedFileIds, []);
});
