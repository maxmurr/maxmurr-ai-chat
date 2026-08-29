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
    !(error instanceof ProjectAccessDeniedError)
  ) {
    reportUnexpectedServerError(error);
  }
}

/** Creates Project in current owner and active Workspace scope. */
export async function createProjectAction(input: unknown) {
  return traceServerAction("createProjectAction", async () => {
    const scope = await requireProjectOwnerScope();

    try {
      const project = await projectController().createProject(input, scope);
      refresh();
      return { ok: true as const, projectId: project.id };
    } catch (error) {
      reportUnexpectedProjectActionError(error);
      return { error: "Could not create Project.", ok: false as const };
    }
  });
}

/** Updates owned Project name and optional description. */
export async function updateProjectDetailsAction(
  projectId: unknown,
  input: unknown
) {
  return traceServerAction("updateProjectDetailsAction", async () => {
    const scope = await requireProjectOwnerScope();

    try {
      await projectController().updateProjectDetails(projectId, input, scope);
      refresh();
      return { ok: true as const };
    } catch (error) {
      reportUnexpectedProjectActionError(error);
      return { error: "Could not update Project.", ok: false as const };
    }
  });
}

/** Persists owned Project Custom Instructions, including empty string. */
export async function updateProjectInstructionsAction(
  projectId: unknown,
  instructions: unknown
) {
  return traceServerAction("updateProjectInstructionsAction", async () => {
    const scope = await requireProjectOwnerScope();

    try {
      await projectController().updateProjectInstructions(
        projectId,
        instructions,
        scope
      );
      refresh();
      return { ok: true as const };
    } catch (error) {
      reportUnexpectedProjectActionError(error);
      return { error: "Could not update instructions.", ok: false as const };
    }
  });
}

/** Deletes owned Project without touching Chat or Library data. */
export async function deleteProjectAction(projectId: unknown) {
  return traceServerAction("deleteProjectAction", async () => {
    const scope = await requireProjectOwnerScope();

    try {
      await projectController().deleteProject(projectId, scope);
      refresh();
      return { ok: true as const };
    } catch (error) {
      reportUnexpectedProjectActionError(error);
      return { error: "Could not delete Project.", ok: false as const };
    }
  });
}
