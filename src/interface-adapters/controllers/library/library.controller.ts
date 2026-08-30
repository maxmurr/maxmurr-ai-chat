import { z } from "zod";

import type { LibraryRepository } from "@/src/application/services/library-repository.service.interface";
import type { LibraryService } from "@/src/application/services/library.service.interface";
import {
  InvalidLibraryRequestError,
  LibraryAccessDeniedError,
  LibraryFileRejectedError,
} from "@/src/entities/errors/library-errors";
import {
  getAcceptedLibraryFileType,
  isAcceptedLibraryFileContent,
  LIBRARY_MAX_FILE_SIZE,
  LIBRARY_MAX_FILES_PER_UPLOAD,
  LIBRARY_MAX_UPLOAD_SIZE,
  type LibraryOwnerScope,
} from "@/src/entities/models/library";

const libraryIdSchema = z.uuid();
const libraryFolderIdSchema = libraryIdSchema.nullable();
const libraryFolderNameSchema = z.string().trim().min(1).max(100);
const libraryFilenameSchema = z
  .string()
  .min(1)
  .max(255)
  .refine(
    (filename) =>
      filename.trim().length > 0 && !/[\u0000-\u001f\u007f]/.test(filename)
  );
const newLibraryFileSchema = z.object({
  bytes: z.instanceof(Uint8Array),
  folderId: libraryFolderIdSchema.default(null),
  mediaType: z.string().max(200),
  name: libraryFilenameSchema,
});
const newLibraryFilesSchema = z.array(newLibraryFileSchema).min(1);
const libraryProvenanceSchema = z.object({
  provenanceChatId: z.uuid(),
  provenanceMessageId: z.string().min(1).max(200),
});
const generatedLibraryFileSchema = z.object({
  bytes: z.instanceof(Uint8Array),
  mediaType: z.string().min(1).max(200),
  name: libraryFilenameSchema,
  ...libraryProvenanceSchema.shape,
});
const generatedLibraryFilesSchema = z.array(generatedLibraryFileSchema).min(1);
const libraryFileIdsSchema = z.array(libraryIdSchema).max(100);

function parseLibraryInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new InvalidLibraryRequestError({ cause: result.error });
  }

  return result.data;
}

/** Validated owner-scoped Library controller resolved by composition root. */
export type LibraryController = ReturnType<typeof createLibraryController>;

/** Creates Folder and File operations with validation and ownership guards. */
export function createLibraryController(
  libraryRepository: LibraryRepository
): LibraryService {
  async function requireOwnedFolder(
    folderId: string,
    scope: LibraryOwnerScope
  ) {
    const folder = await libraryRepository.getOwnedFolder(folderId, scope);

    if (!folder) {
      throw new LibraryAccessDeniedError();
    }

    return folder;
  }

  function validateUploadBatch(files: readonly { bytes: Uint8Array }[]) {
    if (files.length > LIBRARY_MAX_FILES_PER_UPLOAD) {
      throw new LibraryFileRejectedError("count");
    }

    if (
      files.reduce((total, file) => total + file.bytes.byteLength, 0) >
      LIBRARY_MAX_UPLOAD_SIZE
    ) {
      throw new LibraryFileRejectedError("total-size");
    }
  }

  return {
    async createFolder(name: unknown, scope: LibraryOwnerScope) {
      const folderName = parseLibraryInput(libraryFolderNameSchema, name);

      return libraryRepository.createFolder({
        id: crypto.randomUUID(),
        name: folderName,
        ...scope,
      });
    },

    async deleteFile(fileId: unknown, scope: LibraryOwnerScope) {
      const id = parseLibraryInput(libraryIdSchema, fileId);

      if (!(await libraryRepository.deleteOwnedFile(id, scope))) {
        throw new LibraryAccessDeniedError();
      }
    },

    async deleteFolder(folderId: unknown, scope: LibraryOwnerScope) {
      const id = parseLibraryInput(libraryIdSchema, folderId);

      if (!(await libraryRepository.deleteOwnedFolder(id, scope))) {
        throw new LibraryAccessDeniedError();
      }
    },

    async downloadFile(fileId: unknown, scope: LibraryOwnerScope) {
      const id = parseLibraryInput(libraryIdSchema, fileId);
      const file = await libraryRepository.getOwnedFile(id, scope);

      if (!file) {
        throw new LibraryAccessDeniedError();
      }

      return file;
    },

    /** Returns existing ids without exposing metadata or bytes to Chat projection. */
    async findExistingFileIds(
      fileIds: readonly string[],
      scope: LibraryOwnerScope
    ) {
      const result = libraryFileIdsSchema.safeParse(fileIds);
      return result.success
        ? libraryRepository.findOwnedFileIds([...new Set(result.data)], scope)
        : [];
    },

    /** Lists Folders plus File metadata; listing repository never selects bytes. */
    async listLibrary(folderId: unknown, scope: LibraryOwnerScope) {
      const id = parseLibraryInput(libraryFolderIdSchema, folderId);
      const [folders, files] = await Promise.all([
        libraryRepository.listOwnedFolders(scope),
        libraryRepository.listOwnedFiles(id, scope),
      ]);
      const folder = id
        ? (folders.find((candidate) => candidate.id === id) ?? null)
        : null;

      if (id && !folder) {
        throw new LibraryAccessDeniedError();
      }

      return { files, folder, folders };
    },

    /**
     * Links already-uploaded owned Files to originating Chat and Message.
     * References to deleted or foreign Files are skipped, never fatal —
     * regenerating a Message whose File was deleted must still succeed.
     */
    async setChatFileProvenance(
      fileIds: unknown,
      provenance: unknown,
      scope: LibraryOwnerScope
    ) {
      const ids = [
        ...new Set(parseLibraryInput(libraryFileIdsSchema, fileIds)),
      ];

      if (ids.length === 0) {
        return;
      }

      const parsedProvenance = parseLibraryInput(
        libraryProvenanceSchema,
        provenance
      );
      const ownedIds = await libraryRepository.findOwnedFileIds(ids, scope);

      if (ownedIds.length > 0) {
        await libraryRepository.setOwnedFilesProvenance(
          ownedIds,
          parsedProvenance,
          scope
        );
      }
    },

    async moveFile(
      fileId: unknown,
      folderId: unknown,
      scope: LibraryOwnerScope
    ) {
      const id = parseLibraryInput(libraryIdSchema, fileId);
      const targetFolderId = parseLibraryInput(libraryFolderIdSchema, folderId);

      if (targetFolderId) {
        await requireOwnedFolder(targetFolderId, scope);
      }

      if (!(await libraryRepository.moveOwnedFile(id, targetFolderId, scope))) {
        throw new LibraryAccessDeniedError();
      }
    },

    /**
     * Persists assistant-emitted Files with Provenance. Generated bytes come
     * from the model provider, so the user-upload extension whitelist and
     * content sniffing do not apply; size caps still do.
     */
    async saveGeneratedFiles(
      input: unknown,
      scope: LibraryOwnerScope,
      targetFolderId?: string | null
    ) {
      const files = parseLibraryInput(generatedLibraryFilesSchema, input);
      const folderId =
        targetFolderId === undefined
          ? null
          : parseLibraryInput(libraryFolderIdSchema, targetFolderId);
      validateUploadBatch(files);

      if (folderId) {
        await requireOwnedFolder(folderId, scope);
      }

      const newFiles = files.map((file) => {
        if (file.bytes.byteLength > LIBRARY_MAX_FILE_SIZE) {
          throw new LibraryFileRejectedError("size", file.name);
        }

        return {
          ...scope,
          bytes: file.bytes,
          folderId,
          id: crypto.randomUUID(),
          mediaType: file.mediaType.toLowerCase().split(";", 1)[0],
          name: file.name,
          provenanceChatId: file.provenanceChatId,
          provenanceMessageId: file.provenanceMessageId,
          size: file.bytes.byteLength,
        };
      });

      return libraryRepository.createFiles(newFiles);
    },

    /** Validates every File before one batch insert, allowing duplicate names. */
    async uploadFiles(
      input: unknown,
      scope: LibraryOwnerScope,
      targetFolderId?: string | null
    ) {
      const parsedFiles = parseLibraryInput(newLibraryFilesSchema, input);
      const folderId =
        targetFolderId === undefined
          ? undefined
          : parseLibraryInput(libraryFolderIdSchema, targetFolderId);
      const files = parsedFiles.map((file) =>
        folderId === undefined ? file : { ...file, folderId }
      );
      validateUploadBatch(files);

      const folderIds = [
        ...new Set(
          files.flatMap(({ folderId }) => (folderId === null ? [] : [folderId]))
        ),
      ];

      for (const folderId of folderIds) {
        await requireOwnedFolder(folderId, scope);
      }

      const newFiles = files.map((file) => {
        const acceptedType = getAcceptedLibraryFileType(
          file.name,
          file.mediaType
        );

        if (!acceptedType) {
          throw new LibraryFileRejectedError("type", file.name);
        }

        if (file.bytes.byteLength > LIBRARY_MAX_FILE_SIZE) {
          throw new LibraryFileRejectedError("size", file.name);
        }

        if (!isAcceptedLibraryFileContent(acceptedType.mediaType, file.bytes)) {
          throw new LibraryFileRejectedError("type", file.name);
        }

        return {
          ...scope,
          bytes: file.bytes,
          folderId: file.folderId,
          id: crypto.randomUUID(),
          mediaType: acceptedType.mediaType,
          name: file.name,
          provenanceChatId: null,
          provenanceMessageId: null,
          size: file.bytes.byteLength,
        };
      });

      return libraryRepository.createFiles(newFiles);
    },
  };
}
