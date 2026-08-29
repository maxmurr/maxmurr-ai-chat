import { and, desc, eq, isNull } from "drizzle-orm";

import { appDatabase } from "@/drizzle/app-database";
import { project } from "@/drizzle/app-schema";
import type { ProjectRepository } from "@/src/application/services/project-repository.service.interface";
import type { ProjectOwnerScope } from "@/src/entities/models/project";

function ownedProjectWhere(projectId: string, scope: ProjectOwnerScope) {
  return and(
    eq(project.id, projectId),
    eq(project.organizationId, scope.organizationId),
    eq(project.ownerId, scope.ownerId)
  );
}

/** Drizzle-backed owner-scoped Project persistence for PostgreSQL. */
export const drizzleProjectRepository: ProjectRepository = {
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
