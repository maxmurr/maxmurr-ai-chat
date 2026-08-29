import { and, desc, eq, inArray, isNull } from "drizzle-orm"

import { appDatabase } from "@/drizzle/app-database"
import {
  chat,
  libraryFile,
  libraryFolder,
} from "@/drizzle/app-schema"
import type { LibraryRepository } from "@/src/application/services/library-repository.service.interface"
import type { LibraryFileSummary } from "@/src/entities/models/library"

const libraryFileSummaryColumns = {
  createdAt: libraryFile.createdAt,
  folderId: libraryFile.folderId,
  id: libraryFile.id,
  mediaType: libraryFile.mediaType,
  name: libraryFile.name,
  organizationId: libraryFile.organizationId,
  ownerId: libraryFile.ownerId,
  provenanceChatId: libraryFile.provenanceChatId,
  provenanceMessageId: libraryFile.provenanceMessageId,
  size: libraryFile.size,
}

function toLibraryFileSummary(
  row: Omit<LibraryFileSummary, "provenanceChatTitle"> & {
    provenanceChatTitle?: string | null
  }
): LibraryFileSummary {
  return {
    ...row,
    provenanceChatTitle: row.provenanceChatTitle ?? null,
  }
}

function ownedFileWhere(
  fileId: string,
  scope: { organizationId: string; ownerId: string }
) {
  return and(
    eq(libraryFile.id, fileId),
    eq(libraryFile.organizationId, scope.organizationId),
    eq(libraryFile.ownerId, scope.ownerId)
  )
}

function ownedFolderWhere(
  folderId: string,
  scope: { organizationId: string; ownerId: string }
) {
  return and(
    eq(libraryFolder.id, folderId),
    eq(libraryFolder.organizationId, scope.organizationId),
    eq(libraryFolder.ownerId, scope.ownerId)
  )
}

/** Drizzle-backed owner-scoped Library persistence for PostgreSQL. */
export const drizzleLibraryRepository: LibraryRepository = {
  async createFiles(files) {
    const rows = await appDatabase
      .insert(libraryFile)
      .values(files.map((file) => ({ ...file })))
      .returning(libraryFileSummaryColumns)
    return rows.map(toLibraryFileSummary)
  },

  async createFolder(folder) {
    const [row] = await appDatabase
      .insert(libraryFolder)
      .values(folder)
      .returning()
    return row
  },

  async deleteOwnedFile(fileId, scope) {
    const rows = await appDatabase
      .delete(libraryFile)
      .where(ownedFileWhere(fileId, scope))
      .returning({ id: libraryFile.id })
    return rows.length === 1
  },

  async deleteOwnedFolder(folderId, scope) {
    const rows = await appDatabase
      .delete(libraryFolder)
      .where(ownedFolderWhere(folderId, scope))
      .returning({ id: libraryFolder.id })
    return rows.length === 1
  },

  async findOwnedFileIds(fileIds, scope) {
    if (fileIds.length === 0) {
      return []
    }

    const rows = await appDatabase
      .select({ id: libraryFile.id })
      .from(libraryFile)
      .where(
        and(
          inArray(libraryFile.id, [...fileIds]),
          eq(libraryFile.organizationId, scope.organizationId),
          eq(libraryFile.ownerId, scope.ownerId)
        )
      )
    return rows.map(({ id }) => id)
  },

  async getOwnedFile(fileId, scope) {
    const [row] = await appDatabase
      .select({
        ...libraryFileSummaryColumns,
        bytes: libraryFile.bytes,
        provenanceChatTitle: chat.title,
      })
      .from(libraryFile)
      .leftJoin(chat, eq(libraryFile.provenanceChatId, chat.id))
      .where(ownedFileWhere(fileId, scope))

    return row
      ? { ...toLibraryFileSummary(row), bytes: row.bytes }
      : null
  },

  async getOwnedFolder(folderId, scope) {
    const [row] = await appDatabase
      .select()
      .from(libraryFolder)
      .where(ownedFolderWhere(folderId, scope))
    return row ?? null
  },

  async listOwnedFiles(folderId, scope) {
    const rows = await appDatabase
      .select({
        ...libraryFileSummaryColumns,
        provenanceChatTitle: chat.title,
      })
      .from(libraryFile)
      .leftJoin(chat, eq(libraryFile.provenanceChatId, chat.id))
      .where(
        and(
          eq(libraryFile.organizationId, scope.organizationId),
          eq(libraryFile.ownerId, scope.ownerId),
          folderId === null
            ? isNull(libraryFile.folderId)
            : eq(libraryFile.folderId, folderId)
        )
      )
      .orderBy(desc(libraryFile.createdAt), desc(libraryFile.id))
    return rows.map(toLibraryFileSummary)
  },

  async listOwnedFolders(scope) {
    const rows = await appDatabase
      .select()
      .from(libraryFolder)
      .where(
        and(
          eq(libraryFolder.organizationId, scope.organizationId),
          eq(libraryFolder.ownerId, scope.ownerId)
        )
      )
      .orderBy(desc(libraryFolder.createdAt), desc(libraryFolder.id))
    return rows
  },

  async moveOwnedFile(fileId, folderId, scope) {
    const rows = await appDatabase
      .update(libraryFile)
      .set({ folderId })
      .where(ownedFileWhere(fileId, scope))
      .returning({ id: libraryFile.id })
    return rows.length === 1
  },

  async setOwnedFilesProvenance(fileIds, provenance, scope) {
    if (fileIds.length === 0) {
      return 0
    }

    const rows = await appDatabase
      .update(libraryFile)
      .set(provenance)
      .where(
        and(
          inArray(libraryFile.id, [...fileIds]),
          eq(libraryFile.organizationId, scope.organizationId),
          eq(libraryFile.ownerId, scope.ownerId)
        )
      )
      .returning({ id: libraryFile.id })
    return rows.length
  },
}
