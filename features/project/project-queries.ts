import "server-only";

import { cache } from "react";
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

function rethrowProjectPageError(error: unknown): never {
  if (
    error instanceof InvalidProjectRequestError ||
    error instanceof ProjectAccessDeniedError
  ) {
    notFound();
  }

  throw error;
}

/** Lists Projects once per request for current user and active Workspace. */
export const getProjectsPageData = cache(async function getProjectsPageData() {
  return projectController().listProjects(await getProjectOwnerScope());
});

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
    rethrowProjectPageError(error);
  }
}

/** Lists Sources plus owned Files available to link to one Project. */
export async function getProjectSourcesPageData(projectId: string) {
  try {
    const scope = await getProjectOwnerScope();
    const [sources, rootListing] = await Promise.all([
      projectController().listProjectSources(projectId, scope),
      libraryController().listLibrary(null, scope),
    ]);
    const folderFiles = await Promise.all(
      rootListing.folders.map(async ({ id }) => {
        try {
          return (await libraryController().listLibrary(id, scope)).files;
        } catch (error) {
          if (error instanceof LibraryAccessDeniedError) return [];
          throw error;
        }
      })
    );
    const sourceIds = new Set(sources.map(({ id }) => id));

    return {
      availableFiles: [...rootListing.files, ...folderFiles.flat()].filter(
        ({ id }) => !sourceIds.has(id)
      ),
      sources,
    };
  } catch (error) {
    rethrowProjectPageError(error);
  }
}

/** Resolves session-derived Project owner scope from request headers. */
export async function getProjectRequestContext(requestHeaders: Headers) {
  return getWorkspaceOwnerScope(requestHeaders);
}
