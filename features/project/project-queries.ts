import "server-only";

import { notFound } from "next/navigation";

import { resolveApplicationDependency } from "@/di/application-container";
import { applicationInjectionTokens } from "@/di/application-container.registry";
import {
  getAuthenticatedWorkspaceContext,
  getWorkspaceOwnerScope,
} from "@/features/workspace/workspace-queries";
import { LibraryAccessDeniedError } from "@/src/entities/errors/library-errors";
import {
  InvalidProjectRequestError,
  ProjectAccessDeniedError,
} from "@/src/entities/errors/project-errors";
import type { Project } from "@/src/entities/models/project";

function projectController() {
  return resolveApplicationDependency(
    applicationInjectionTokens.projectController
  );
}

function libraryController() {
  return resolveApplicationDependency(
    applicationInjectionTokens.libraryController
  );
}

async function getProjectOwnerScope() {
  const { activeWorkspaceId, userId } =
    await getAuthenticatedWorkspaceContext();
  return { organizationId: activeWorkspaceId, ownerId: userId };
}

/** Lists Projects owned by current user in active Workspace. */
export async function getProjectsPageData() {
  return projectController().listProjects(await getProjectOwnerScope());
}

/** Loads one owned Project by id or renders resource not-found state. */
export async function getProjectPageData(projectId: string) {
  try {
    const scope = await getProjectOwnerScope();
    const [project, chats] = await Promise.all([
      projectController().getProject(projectId, scope),
      projectController().listProjectChats(projectId, scope),
    ]);
    return { ...project, chats };
  } catch (error) {
    if (
      error instanceof InvalidProjectRequestError ||
      error instanceof ProjectAccessDeniedError
    ) {
      notFound();
    }

    throw error;
  }
}

/** Lists Sources plus owned Files available to move into one Project. */
export async function getProjectSourcesPageData(
  project: Pick<Project, "folderId" | "id">
) {
  const scope = await getProjectOwnerScope();
  const [sources, rootListing] = await Promise.all([
    projectController().listProjectSources(project.id, scope),
    libraryController().listLibrary(null, scope),
  ]);
  // ponytail: one query per flat Folder; add an all-Files repository read if
  // large Libraries make this picker slow.
  const folderFiles = await Promise.all(
    rootListing.folders
      .filter(({ id }) => id !== project.folderId)
      .map(async ({ id }) => {
        try {
          return (await libraryController().listLibrary(id, scope)).files;
        } catch (error) {
          if (error instanceof LibraryAccessDeniedError) return [];
          throw error;
        }
      })
  );

  return {
    availableFiles: [...rootListing.files, ...folderFiles.flat()],
    sources,
  };
}

/** Resolves session-derived Project owner scope from request headers. */
export async function getProjectRequestContext(requestHeaders: Headers) {
  return getWorkspaceOwnerScope(requestHeaders);
}
