import { z } from "zod";

import type { ProjectRepository } from "@/src/application/services/project-repository.service.interface";
import type { ProjectService } from "@/src/application/services/project.service.interface";
import {
  InvalidProjectRequestError,
  ProjectAccessDeniedError,
} from "@/src/entities/errors/project-errors";
import type { ProjectOwnerScope } from "@/src/entities/models/project";

const projectIdSchema = z.uuid();
const projectNameSchema = z.string().trim().min(1).max(100);
const projectDescriptionSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((description) => description || null);
const projectInstructionsSchema = z.string().trim().max(10_000);
const projectDetailsSchema = z.object({
  description: projectDescriptionSchema,
  name: projectNameSchema,
});

function parseProjectInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new InvalidProjectRequestError({ cause: result.error });
  }

  return result.data;
}

/** Validated owner-scoped Project controller resolved by composition root. */
export type ProjectController = ReturnType<typeof createProjectController>;

/** Creates Project CRUD operations with validation and ownership guards. */
export function createProjectController(
  projectRepository: ProjectRepository
): ProjectService {
  function requireOwnedProject<T>(project: T | null): T {
    if (!project) {
      throw new ProjectAccessDeniedError();
    }

    return project;
  }

  return {
    async createProject(input: unknown, scope: ProjectOwnerScope) {
      const details = parseProjectInput(projectDetailsSchema, input);

      return projectRepository.createProject({
        ...details,
        ...scope,
        id: crypto.randomUUID(),
        instructions: "",
      });
    },

    async deleteProject(projectId: unknown, scope: ProjectOwnerScope) {
      const id = parseProjectInput(projectIdSchema, projectId);

      if (!(await projectRepository.deleteOwnedProject(id, scope))) {
        throw new ProjectAccessDeniedError();
      }
    },

    async getProject(projectId: unknown, scope: ProjectOwnerScope) {
      const id = parseProjectInput(projectIdSchema, projectId);
      return requireOwnedProject(
        await projectRepository.getOwnedProject(id, scope)
      );
    },

    async listProjects(scope: ProjectOwnerScope) {
      return projectRepository.listOwnedProjects(scope);
    },

    async updateProjectDetails(
      projectId: unknown,
      input: unknown,
      scope: ProjectOwnerScope
    ) {
      const id = parseProjectInput(projectIdSchema, projectId);
      const details = parseProjectInput(projectDetailsSchema, input);
      return requireOwnedProject(
        await projectRepository.updateOwnedProjectDetails(id, details, scope)
      );
    },

    async updateProjectInstructions(
      projectId: unknown,
      instructions: unknown,
      scope: ProjectOwnerScope
    ) {
      const id = parseProjectInput(projectIdSchema, projectId);
      const value = parseProjectInput(projectInstructionsSchema, instructions);
      return requireOwnedProject(
        await projectRepository.updateOwnedProjectInstructions(id, value, scope)
      );
    },
  };
}
