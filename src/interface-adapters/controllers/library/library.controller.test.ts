import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  LibraryRepository,
  NewLibraryFile,
} from "@/src/application/services/library-repository.service.interface";
import {
  LibraryAccessDeniedError,
  LibraryFileRejectedError,
} from "@/src/entities/errors/library-errors";
import type {
  LibraryFile,
  LibraryFileSummary,
  LibraryFolder,
  LibraryOwnerScope,
} from "@/src/entities/models/library";
import { LIBRARY_MAX_FILE_SIZE } from "@/src/entities/models/library";
import { createLibraryController } from "@/src/interface-adapters/controllers/library/library.controller";

const ownerScope: LibraryOwnerScope = {
  organizationId: "workspace-1",
  ownerId: "user-1",
};
const otherOwnerScope: LibraryOwnerScope = {
  organizationId: "workspace-1",
  ownerId: "user-2",
};
const folderId = "10000000-0000-4000-8000-000000000001";
const otherFolderId = "10000000-0000-4000-8000-000000000002";
const fileId = "20000000-0000-4000-8000-000000000001";
const otherFileId = "20000000-0000-4000-8000-000000000002";
const chatId = "30000000-0000-4000-8000-000000000001";
const createdAt = new Date("2026-08-28T00:00:00.000Z");

function withoutBytes(file: LibraryFile): LibraryFileSummary {
  const { bytes, ...summary } = file;
  void bytes;
  return summary;
}

class InMemoryLibraryRepository implements LibraryRepository {
  files: LibraryFile[] = [];
  folders: LibraryFolder[] = [];

  async createFiles(files: readonly NewLibraryFile[]) {
    const created = files.map((file) => ({
      ...file,
      createdAt,
      provenanceChatTitle: null,
    }));
    this.files.push(...created);
    return created.map(withoutBytes);
  }

  async createFolder(folder: {
    id: string;
    name: string;
    organizationId: string;
    ownerId: string;
  }) {
    const created = { ...folder, createdAt };
    this.folders.push(created);
    return created;
  }

  async deleteOwnedFile(id: string, scope: LibraryOwnerScope) {
    const index = this.files.findIndex(
      (file) => file.id === id && this.matches(file, scope)
    );
    if (index === -1) return false;
    this.files.splice(index, 1);
    return true;
  }

  async deleteOwnedFolder(id: string, scope: LibraryOwnerScope) {
    const index = this.folders.findIndex(
      (folder) => folder.id === id && this.matches(folder, scope)
    );
    if (index === -1) return false;
    this.folders.splice(index, 1);
    this.files = this.files.filter((file) => file.folderId !== id);
    return true;
  }

  async findOwnedFileIds(ids: readonly string[], scope: LibraryOwnerScope) {
    return this.files
      .filter((file) => ids.includes(file.id) && this.matches(file, scope))
      .map(({ id }) => id);
  }

  async getOwnedFile(id: string, scope: LibraryOwnerScope) {
    return (
      this.files.find((file) => file.id === id && this.matches(file, scope)) ??
      null
    );
  }

  async getOwnedFolder(id: string, scope: LibraryOwnerScope) {
    return (
      this.folders.find(
        (folder) => folder.id === id && this.matches(folder, scope)
      ) ?? null
    );
  }

  async listOwnedFiles(folder: string | null, scope: LibraryOwnerScope) {
    return this.files
      .filter((file) => file.folderId === folder && this.matches(file, scope))
      .map(withoutBytes);
  }

  async listOwnedFolders(scope: LibraryOwnerScope) {
    return this.folders.filter((folder) => this.matches(folder, scope));
  }

  async moveOwnedFile(
    id: string,
    targetFolderId: string | null,
    scope: LibraryOwnerScope
  ) {
    const file = await this.getOwnedFile(id, scope);
    if (!file) return false;
    this.files = this.files.map((candidate) =>
      candidate === file
        ? { ...candidate, folderId: targetFolderId }
        : candidate
    );
    return true;
  }

  async setOwnedFilesProvenance(
    ids: readonly string[],
    provenance: { provenanceChatId: string; provenanceMessageId: string },
    scope: LibraryOwnerScope
  ) {
    let count = 0;
    this.files = this.files.map((file) => {
      if (!ids.includes(file.id) || !this.matches(file, scope)) return file;
      count += 1;
      return { ...file, ...provenance };
    });
    return count;
  }

  private matches(
    value: { organizationId: string; ownerId: string },
    scope: LibraryOwnerScope
  ) {
    return (
      value.organizationId === scope.organizationId &&
      value.ownerId === scope.ownerId
    );
  }
}

function seedRepository() {
  const repository = new InMemoryLibraryRepository();
  repository.folders = [
    { ...ownerScope, createdAt, id: folderId, name: "Owned" },
    {
      ...otherOwnerScope,
      createdAt,
      id: otherFolderId,
      name: "Other owner's",
    },
  ];
  repository.files = [
    {
      ...ownerScope,
      bytes: new Uint8Array([1]),
      createdAt,
      folderId: null,
      id: fileId,
      mediaType: "application/pdf",
      name: "owned.pdf",
      provenanceChatId: null,
      provenanceChatTitle: null,
      provenanceMessageId: null,
      size: 1,
    },
    {
      ...otherOwnerScope,
      bytes: new Uint8Array([2]),
      createdAt,
      folderId: otherFolderId,
      id: otherFileId,
      mediaType: "application/pdf",
      name: "other.pdf",
      provenanceChatId: null,
      provenanceChatTitle: null,
      provenanceMessageId: null,
      size: 1,
    },
  ];
  return repository;
}

test("Library rejects disallowed and oversized Files before persistence", async () => {
  const repository = new InMemoryLibraryRepository();
  const controller = createLibraryController(repository);

  await assert.rejects(
    controller.uploadFiles(
      [
        {
          bytes: new Uint8Array([1]),
          name: "payload.exe",
          mediaType: "application/octet-stream",
        },
      ],
      ownerScope
    ),
    (error: unknown) =>
      error instanceof LibraryFileRejectedError && error.reason === "type"
  );
  await assert.rejects(
    controller.uploadFiles(
      [
        {
          bytes: new Uint8Array(LIBRARY_MAX_FILE_SIZE + 1),
          name: "large.pdf",
          mediaType: "application/pdf",
        },
      ],
      ownerScope
    ),
    (error: unknown) =>
      error instanceof LibraryFileRejectedError && error.reason === "size"
  );
  await assert.rejects(
    controller.uploadFiles(
      [
        {
          bytes: new TextEncoder().encode("not a PDF"),
          name: "forged.pdf",
          mediaType: "application/pdf",
        },
      ],
      ownerScope
    ),
    (error: unknown) =>
      error instanceof LibraryFileRejectedError && error.reason === "type"
  );
  await assert.rejects(
    controller.uploadFiles(
      Array.from({ length: 21 }, (_, index) => ({
        bytes: new TextEncoder().encode("safe text"),
        name: `notes-${index}.txt`,
        mediaType: "text/plain",
      })),
      ownerScope
    ),
    (error: unknown) =>
      error instanceof LibraryFileRejectedError && error.reason === "count"
  );
  assert.equal(repository.files.length, 0);
});

test("server-derived upload Folder overrides client Folder input", async () => {
  const repository = seedRepository();
  const controller = createLibraryController(repository);

  const [uploaded] = await controller.uploadFiles(
    [
      {
        bytes: new TextEncoder().encode("safe text"),
        folderId: otherFolderId,
        mediaType: "text/plain",
        name: "source.txt",
      },
    ],
    ownerScope,
    folderId
  );

  assert.equal(uploaded.folderId, folderId);
});

test("Library listings stay scoped to owner and workspace without bytes", async () => {
  const repository = seedRepository();
  const controller = createLibraryController(repository);

  const listing = await controller.listLibrary(null, ownerScope);

  assert.deepEqual(
    listing.files.map(({ id }) => id),
    [fileId]
  );
  assert.deepEqual(
    listing.folders.map(({ id }) => id),
    [folderId]
  );
  assert.equal("bytes" in listing.files[0], false);
});

test("Library denies another owner's File and Folder mutations", async () => {
  const controller = createLibraryController(seedRepository());

  await assert.rejects(
    controller.deleteFile(otherFileId, ownerScope),
    LibraryAccessDeniedError
  );
  await assert.rejects(
    controller.deleteFolder(otherFolderId, ownerScope),
    LibraryAccessDeniedError
  );
  await assert.rejects(
    controller.moveFile(fileId, otherFolderId, ownerScope),
    LibraryAccessDeniedError
  );
});

test("deleting owned Folder cascades to its Files", async () => {
  const repository = seedRepository();
  repository.files = repository.files.map((file) =>
    file.id === fileId ? { ...file, folderId } : file
  );
  const controller = createLibraryController(repository);

  await controller.deleteFolder(folderId, ownerScope);

  assert.equal(
    repository.folders.some(({ id }) => id === folderId),
    false
  );
  assert.equal(
    repository.files.some(({ id }) => id === fileId),
    false
  );
});

test("moving File requires owned target Folder and accepts Library root", async () => {
  const repository = seedRepository();
  const controller = createLibraryController(repository);

  await controller.moveFile(fileId, folderId, ownerScope);
  assert.equal(
    repository.files.find(({ id }) => id === fileId)?.folderId,
    folderId
  );

  await controller.moveFile(fileId, null, ownerScope);
  assert.equal(
    repository.files.find(({ id }) => id === fileId)?.folderId,
    null
  );
});

test("chat ingestion records Provenance only on owned Files", async () => {
  const repository = seedRepository();
  const controller = createLibraryController(repository);
  const provenance = {
    provenanceChatId: chatId,
    provenanceMessageId: "message-1",
  };
  const deletedFileId = "20000000-0000-4000-8000-00000000dead";

  // Deleted and foreign references are skipped, never fatal — regenerating a
  // Message whose File was deleted must still succeed.
  await controller.setChatFileProvenance(
    [fileId, otherFileId, deletedFileId],
    provenance,
    ownerScope
  );

  assert.partialDeepStrictEqual(
    repository.files.find(({ id }) => id === fileId),
    provenance
  );
  assert.partialDeepStrictEqual(
    repository.files.find(({ id }) => id === otherFileId),
    { provenanceChatId: null, provenanceMessageId: null }
  );
});

test("assistant-generated Files skip the upload whitelist but keep size caps", async () => {
  const repository = seedRepository();
  const controller = createLibraryController(repository);

  const [saved] = await controller.saveGeneratedFiles(
    [
      {
        bytes: new TextEncoder().encode("<svg/>"),
        mediaType: "image/svg+xml",
        name: "chart.svg",
        provenanceChatId: chatId,
        provenanceMessageId: "message-1",
      },
    ],
    ownerScope
  );

  assert.partialDeepStrictEqual(saved, {
    mediaType: "image/svg+xml",
    name: "chart.svg",
    provenanceChatId: chatId,
    provenanceMessageId: "message-1",
  });

  await assert.rejects(
    controller.saveGeneratedFiles(
      [
        {
          bytes: new Uint8Array(LIBRARY_MAX_FILE_SIZE + 1),
          mediaType: "image/png",
          name: "huge.png",
          provenanceChatId: chatId,
          provenanceMessageId: "message-1",
        },
      ],
      ownerScope
    ),
    (error: unknown) =>
      error instanceof LibraryFileRejectedError && error.reason === "size"
  );
});
