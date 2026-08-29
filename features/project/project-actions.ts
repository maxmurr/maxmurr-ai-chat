"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { resolveApplicationDependency } from "@/di/application-container";
import { applicationInjectionTokens } from "@/di/application-container.registry";
import { getProjectRequestContext } from "@/features/project/project-queries";
import { reportUnexpectedServerError } from "@/lib/server-error-reporting";
import { traceServerAction } from "@/lib/server-action-tracing";
import {
  InvalidLibraryRequestError,
  LibraryAccessDeniedError,
} from "@/src/entities/errors/library-errors";
import {
  InvalidProjectRequestError,
  ProjectAccessDeniedError,
} from "@/src/entities/errors/project-errors";

async function requireProjectOwnerScope() {
  const context = await getProjectRequestContext(await headers());

  if (context.status === "unauthorized") {
    redirect("/sign-in");
  }

  if (context.status === "workspace-required") {
    redirect("/onboarding");
  }

  return context.scope;
}

function projectController() {
  return resolveApplicationDependency(
    applicationInjectionTokens.projectController
  );
}

function reportUnexpectedProjectActionError(error: unknown) {
  if (
    !(error instanceof InvalidProjectRequestError) &&
    !(error instanceof ProjectAccessDeniedError) &&
    !(error instanceof InvalidLibraryRequestError) &&
    !(error instanceof LibraryAccessDeniedError)
  ) {
    reportUnexpectedServerError(error);
  }
}

type ProjectActionResult<T extends object> =
  ({ ok: true } & T) | { error: string; ok: false };

async function runProjectMutation<T extends object>(
  actionName: string,
  errorMessage: string,
  mutation: (
    controller: ReturnType<typeof projectController>,
    scope: Awaited<ReturnType<typeof requireProjectOwnerScope>>
  ) => Promise<T>
): Promise<ProjectActionResult<T>> {
  return traceServerAction(actionName, async () => {
    const scope = await requireProjectOwnerScope();

    try {
      const result = await mutation(projectController(), scope);
      refresh();
      return { ...result, ok: true as const };
    } catch (error) {
      reportUnexpectedProjectActionError(error);
      return { error: errorMessage, ok: false as const };
    }
  });
}

/** Attaches owner Chat to owned Project in active Workspace. */
export async function attachChatToProjectAction(
  projectId: unknown,
  chatId: unknown
) {
  return runProjectMutation(
    "attachChatToProjectAction",
    "Could not add Chat to Project.",
    async (controller, scope) => {
      await controller.attachChat(projectId, chatId, scope);
      return {};
    }
  );
}

/** Detaches owner Chat from its Project in active Workspace. */
export async function detachChatFromProjectAction(chatId: unknown) {
  return runProjectMutation(
    "detachChatFromProjectAction",
    "Could not remove Chat from Project.",
    async (controller, scope) => {
      await controller.detachChat(chatId, scope);
      return {};
    }
  );
}

/** Creates Project in current owner and active Workspace scope. */
export async function createProjectAction(input: unknown) {
  return runProjectMutation(
    "createProjectAction",
    "Could not create Project.",
    async (controller, scope) => {
      const project = await controller.createProject(input, scope);
      return { projectId: project.id };
    }
  );
}

/** Links one owned Library File to Project without moving it. */
export async function addProjectSourceAction(
  projectId: unknown,
  fileId: unknown
) {
  return runProjectMutation(
    "addProjectSourceAction",
    "Could not add Source.",
    async (controller, scope) => {
      await controller.addProjectSource(projectId, fileId, scope);
      return {};
    }
  );
}

/** Unlinks one Source without changing its Library location. */
export async function removeProjectSourceAction(
  projectId: unknown,
  fileId: unknown
) {
  return runProjectMutation(
    "removeProjectSourceAction",
    "Could not remove Source.",
    async (controller, scope) => {
      await controller.removeProjectSource(projectId, fileId, scope);
      return {};
    }
  );
}

/** Updates owned Project name and optional description. */
export async function updateProjectDetailsAction(
  projectId: unknown,
  input: unknown
) {
  return runProjectMutation(
    "updateProjectDetailsAction",
    "Could not update Project.",
    async (controller, scope) => {
      await controller.updateProjectDetails(projectId, input, scope);
      return {};
    }
  );
}

/** Persists owned Project Custom Instructions, including empty string. */
export async function updateProjectInstructionsAction(
  projectId: unknown,
  instructions: unknown
) {
  return runProjectMutation(
    "updateProjectInstructionsAction",
    "Could not update instructions.",
    async (controller, scope) => {
      await controller.updateProjectInstructions(
        projectId,
        instructions,
        scope
      );
      return {};
    }
  );
}

/** Deletes owned Project and its Chats while leaving Library data untouched. */
export async function deleteProjectAction(projectId: unknown) {
  return runProjectMutation(
    "deleteProjectAction",
    "Could not delete Project.",
    async (controller, scope) => {
      await controller.deleteProject(projectId, scope);
      return {};
    }
  );
}
