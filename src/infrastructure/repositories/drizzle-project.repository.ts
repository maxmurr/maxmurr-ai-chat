import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { appDatabase } from "@/drizzle/app-database";
import {
  chat,
  libraryFile,
  project,
  projectSource,
} from "@/drizzle/app-schema";
import type { ProjectRepository } from "@/src/application/services/project-repository.service.interface";
import type { LibraryFileSummary } from "@/src/entities/models/library";
import type { ProjectOwnerScope } from "@/src/entities/models/project";

const sourceFileColumns = {
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
};

function toLibraryFileSummary(
  row: Omit<LibraryFileSummary, "provenanceChatTitle"> & {
    provenanceChatTitle: string | null;
  }
): LibraryFileSummary {
  return row;
}

function ownedProjectWhere(projectId: string, scope: ProjectOwnerScope) {
  return and(
    eq(project.id, projectId),
    eq(project.organizationId, scope.organizationId),
    eq(project.ownerId, scope.ownerId)
  );
}

/** Drizzle-backed owner-scoped Project persistence for PostgreSQL. */
export const drizzleProjectRepository: ProjectRepository = {
  async addOwnedProjectSources(projectId, fileIds, scope) {
    const uniqueFileIds = [...new Set(fileIds)];
    if (uniqueFileIds.length === 0) return true;

    const [ownedProject] = await appDatabase
      .select({ id: project.id })
      .from(project)
      .where(ownedProjectWhere(projectId, scope));
    if (!ownedProject) return false;

    const ownedFiles = await appDatabase
      .select({ id: libraryFile.id })
      .from(libraryFile)
      .where(
        and(
          inArray(libraryFile.id, uniqueFileIds),
          eq(libraryFile.organizationId, scope.organizationId),
          eq(libraryFile.ownerId, scope.ownerId)
        )
      );
    if (ownedFiles.length !== uniqueFileIds.length) return false;

    await appDatabase
      .insert(projectSource)
      .values(
        ownedFiles.map(({ id }) => ({ fileId: id, projectId: ownedProject.id }))
      )
      .onConflictDoNothing();
    return true;
  },

  async createProject(newProject) {
    const [row] = await appDatabase
      .insert(project)
      .values(newProject)
      .returning();
    return row;
  },

  async deleteOwnedProject(projectId, scope) {
    const rows = await appDatabase
      .delete(project)
      .where(ownedProjectWhere(projectId, scope))
      .returning({ id: project.id });
    return rows.length === 1;
  },

  async getOwnedProject(projectId, scope) {
    const [row] = await appDatabase
      .select()
      .from(project)
      .where(ownedProjectWhere(projectId, scope));
    return row ?? null;
  },

  async listOwnedProjects(scope) {
    return appDatabase
      .select()
      .from(project)
      .where(
        and(
          eq(project.organizationId, scope.organizationId),
          eq(project.ownerId, scope.ownerId)
        )
      )
      .orderBy(desc(project.updatedAt), desc(project.id));
  },

  async listOwnedProjectSources(projectId, scope) {
    const rows = await appDatabase
      .select({
        ...sourceFileColumns,
        provenanceChatTitle: chat.title,
      })
      .from(projectSource)
      .innerJoin(project, eq(projectSource.projectId, project.id))
      .innerJoin(libraryFile, eq(projectSource.fileId, libraryFile.id))
      .leftJoin(chat, eq(libraryFile.provenanceChatId, chat.id))
      .where(
        and(
          eq(projectSource.projectId, projectId),
          eq(project.organizationId, scope.organizationId),
          eq(project.ownerId, scope.ownerId),
          eq(libraryFile.organizationId, scope.organizationId),
          eq(libraryFile.ownerId, scope.ownerId)
        )
      )
      .orderBy(desc(projectSource.createdAt), desc(libraryFile.id));
    return rows.map(toLibraryFileSummary);
  },

  async removeOwnedProjectSource(projectId, fileId, scope) {
    const [ownedProject] = await appDatabase
      .select({ id: project.id })
      .from(project)
      .where(ownedProjectWhere(projectId, scope));
    if (!ownedProject) return false;

    const rows = await appDatabase
      .delete(projectSource)
      .where(
        and(
          eq(projectSource.projectId, ownedProject.id),
          eq(projectSource.fileId, fileId)
        )
      )
      .returning({ fileId: projectSource.fileId });
    return rows.length === 1;
  },

  async updateOwnedProjectDetails(projectId, details, scope) {
    const [row] = await appDatabase
      .update(project)
      .set(details)
      .where(ownedProjectWhere(projectId, scope))
      .returning();
    return row ?? null;
  },

  async updateOwnedProjectInstructions(projectId, instructions, scope) {
    const [row] = await appDatabase
      .update(project)
      .set({ instructions })
      .where(ownedProjectWhere(projectId, scope))
      .returning();
    return row ?? null;
  },

  async updateOwnedProjectPinned(projectId, pinned, scope) {
    const [row] = await appDatabase
      .update(project)
      .set({ pinned })
      .where(ownedProjectWhere(projectId, scope))
      .returning();
    return row ?? null;
  },

  async claimOwnedProjectFolderId(
    projectId,
    expectedFolderId,
    folderId,
    scope
  ) {
    const [row] = await appDatabase
      .update(project)
      .set({ folderId })
      .where(
        and(
          ownedProjectWhere(projectId, scope),
          expectedFolderId === null
            ? isNull(project.folderId)
            : eq(project.folderId, expectedFolderId)
        )
      )
      .returning();
    return row ?? null;
  },
};
