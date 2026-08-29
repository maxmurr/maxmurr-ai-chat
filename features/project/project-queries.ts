import "server-only";

import { notFound } from "next/navigation";

import { resolveApplicationDependency } from "@/di/application-container";
import { applicationInjectionTokens } from "@/di/application-container.registry";
import {
  getAuthenticatedWorkspaceContext,
  getWorkspaceOwnerScope,
} from "@/features/workspace/workspace-queries";
import {
  InvalidProjectRequestError,
  ProjectAccessDeniedError,
} from "@/src/entities/errors/project-errors";

function projectController() {
  return resolveApplicationDependency(
    applicationInjectionTokens.projectController
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
    return await projectController().getProject(
      projectId,
      await getProjectOwnerScope()
    );
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

/** Resolves session-derived Project owner scope from request headers. */
export async function getProjectRequestContext(requestHeaders: Headers) {
  return getWorkspaceOwnerScope(requestHeaders);
}
