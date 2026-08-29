import type {
  LibraryFile,
  LibraryFileSummary,
  LibraryFolder,
  LibraryOwnerScope,
} from "@/src/entities/models/library"

/** Metadata and bytes accepted by Library persistence after controller validation. */
export type NewLibraryFile = LibraryOwnerScope & {
  readonly bytes: Uint8Array
  readonly folderId: string | null
  readonly id: string
  readonly mediaType: string
  readonly name: string
  readonly provenanceChatId: string | null
  readonly provenanceMessageId: string | null
  readonly size: number
}

/** Persists owner-scoped Library Folders, File metadata, and File bytes. */
export type LibraryRepository = {
  createFiles(files: readonly NewLibraryFile[]): Promise<LibraryFileSummary[]>
  createFolder(folder: {
    id: string
    name: string
    organizationId: string
    ownerId: string
  }): Promise<LibraryFolder>
  deleteOwnedFile(fileId: string, scope: LibraryOwnerScope): Promise<boolean>
  deleteOwnedFolder(folderId: string, scope: LibraryOwnerScope): Promise<boolean>
  findOwnedFileIds(
    fileIds: readonly string[],
    scope: LibraryOwnerScope
  ): Promise<string[]>
  getOwnedFile(
    fileId: string,
    scope: LibraryOwnerScope
  ): Promise<LibraryFile | null>
  getOwnedFolder(
    folderId: string,
    scope: LibraryOwnerScope
  ): Promise<LibraryFolder | null>
  listOwnedFiles(
    folderId: string | null,
    scope: LibraryOwnerScope
  ): Promise<LibraryFileSummary[]>
  listOwnedFolders(scope: LibraryOwnerScope): Promise<LibraryFolder[]>
  moveOwnedFile(
    fileId: string,
    folderId: string | null,
    scope: LibraryOwnerScope
  ): Promise<boolean>
  setOwnedFilesProvenance(
    fileIds: readonly string[],
    provenance: { provenanceChatId: string; provenanceMessageId: string },
    scope: LibraryOwnerScope
  ): Promise<number>
}
