import { z } from "zod";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
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
  projectRepository: ProjectRepository,
  chatRepository: ChatRepository
): ProjectService {
  function requireOwnedProject<T>(project: T | null): T {
    if (!project) {
      throw new ProjectAccessDeniedError();
    }

    return project;
  }

  async function getOwnedProject(projectId: unknown, scope: ProjectOwnerScope) {
    const id = parseProjectInput(projectIdSchema, projectId);
    return requireOwnedProject(
      await projectRepository.getOwnedProject(id, scope)
    );
  }

  async function requireOwnedChat(chatId: unknown, scope: ProjectOwnerScope) {
    const id = parseProjectInput(projectIdSchema, chatId);
    const chat = await chatRepository.getChatById(id);

    if (
      !chat ||
      chat.organizationId !== scope.organizationId ||
      chat.ownerId !== scope.ownerId
    ) {
      throw new ProjectAccessDeniedError();
    }

    return chat;
  }

  return {
    async attachChat(
      projectId: unknown,
      chatId: unknown,
      scope: ProjectOwnerScope
    ) {
      const project = await getOwnedProject(projectId, scope);
      const chat = await requireOwnedChat(chatId, scope);
      await chatRepository.updateChatProject(chat.id, project.id);
    },

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
      const project = await getOwnedProject(projectId, scope);
      const chats = await chatRepository.listChatsByProject(project.id);

      for (const chat of chats) {
        await chatRepository.deleteChat(chat.id);
      }

      if (!(await projectRepository.deleteOwnedProject(project.id, scope))) {
        throw new ProjectAccessDeniedError();
      }
    },

    async detachChat(chatId: unknown, scope: ProjectOwnerScope) {
      const chat = await requireOwnedChat(chatId, scope);
      await chatRepository.updateChatProject(chat.id, null);
    },

    async getProject(projectId: unknown, scope: ProjectOwnerScope) {
      return getOwnedProject(projectId, scope);
    },

    async listProjectChats(projectId: unknown, scope: ProjectOwnerScope) {
      const project = await getOwnedProject(projectId, scope);
      return chatRepository.listChatsByProject(project.id);
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
