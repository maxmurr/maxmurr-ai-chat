import type {
  LibraryFile,
  LibraryFileSummary,
  LibraryFolder,
  LibraryOwnerScope,
} from "@/src/entities/models/library";

/** Owner-checked Folder and File operations exposed by Library controller. */
export type LibraryService = {
  createFolder(name: unknown, scope: LibraryOwnerScope): Promise<LibraryFolder>;
  deleteFile(fileId: unknown, scope: LibraryOwnerScope): Promise<void>;
  deleteFolder(folderId: unknown, scope: LibraryOwnerScope): Promise<void>;
  downloadFile(fileId: unknown, scope: LibraryOwnerScope): Promise<LibraryFile>;
  findExistingFileIds(
    fileIds: readonly string[],
    scope: LibraryOwnerScope
  ): Promise<string[]>;
  listLibrary(
    folderId: unknown,
    scope: LibraryOwnerScope
  ): Promise<{
    files: LibraryFileSummary[];
    folder: LibraryFolder | null;
    folders: LibraryFolder[];
  }>;
  moveFile(
    fileId: unknown,
    folderId: unknown,
    scope: LibraryOwnerScope
  ): Promise<void>;
  saveGeneratedFiles(
    input: unknown,
    scope: LibraryOwnerScope
  ): Promise<LibraryFileSummary[]>;
  setChatFileProvenance(
    fileIds: unknown,
    provenance: unknown,
    scope: LibraryOwnerScope
  ): Promise<void>;
  uploadFiles(
    input: unknown,
    scope: LibraryOwnerScope,
    targetFolderId?: string
  ): Promise<LibraryFileSummary[]>;
};
