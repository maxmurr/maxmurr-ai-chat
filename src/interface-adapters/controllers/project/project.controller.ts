import { z } from "zod";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { ProjectRepository } from "@/src/application/services/project-repository.service.interface";
import type { LibraryService } from "@/src/application/services/library.service.interface";
import type { ProjectService } from "@/src/application/services/project.service.interface";
import { LibraryAccessDeniedError } from "@/src/entities/errors/library-errors";
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

type ProjectSourceLibraryService = Pick<
  LibraryService,
  "createFolder" | "listLibrary" | "moveFile" | "uploadFiles"
>;

/** Creates Project and Source operations with validation and ownership guards. */
export function createProjectController(
  projectRepository: ProjectRepository,
  chatRepository: ChatRepository,
  libraryService: ProjectSourceLibraryService
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

  async function listProjectSourceFiles(
    projectId: unknown,
    scope: ProjectOwnerScope
  ) {
    const ownedProject = await getOwnedProject(projectId, scope);

    if (!ownedProject.folderId) {
      return [];
    }

    try {
      return (await libraryService.listLibrary(ownedProject.folderId, scope))
        .files;
    } catch (error) {
      if (error instanceof LibraryAccessDeniedError) {
        return [];
      }
      throw error;
    }
  }

  async function ensureProjectFolder(
    projectId: unknown,
    scope: ProjectOwnerScope
  ) {
    const ownedProject = await getOwnedProject(projectId, scope);

    if (ownedProject.folderId) {
      try {
        const listing = await libraryService.listLibrary(
          ownedProject.folderId,
          scope
        );
        if (listing.folder) return listing.folder;
      } catch (error) {
        if (!(error instanceof LibraryAccessDeniedError)) throw error;
      }
    }

    // ponytail: UI serializes Source mutations; use an atomic Folder claim if
    // concurrent multi-client uploads become supported.
    const folder = await libraryService.createFolder(ownedProject.name, scope);
    requireOwnedProject(
      await projectRepository.updateOwnedProjectFolderId(
        ownedProject.id,
        folder.id,
        scope
      )
    );
    return folder;
  }

  async function resolveChatFileFolderId(
    chatId: unknown,
    scope: ProjectOwnerScope
  ) {
    const chat = await requireOwnedChat(chatId, scope);
    return chat.projectId
      ? (await ensureProjectFolder(chat.projectId, scope)).id
      : null;
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
        folderId: null,
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

    async listProjectSources(projectId: unknown, scope: ProjectOwnerScope) {
      return listProjectSourceFiles(projectId, scope);
    },

    async addProjectSource(
      projectId: unknown,
      fileId: unknown,
      scope: ProjectOwnerScope
    ) {
      const id = parseProjectInput(projectIdSchema, fileId);
      const folder = await ensureProjectFolder(projectId, scope);
      await libraryService.moveFile(id, folder.id, scope);
    },

    async removeProjectSource(
      projectId: unknown,
      fileId: unknown,
      scope: ProjectOwnerScope
    ) {
      const id = parseProjectInput(projectIdSchema, fileId);
      const sources = await listProjectSourceFiles(projectId, scope);

      if (!sources.some((source) => source.id === id)) {
        throw new ProjectAccessDeniedError();
      }

      await libraryService.moveFile(id, null, scope);
    },

    resolveChatFileFolderId,

    async uploadChatFiles(
      chatId: unknown,
      input: unknown,
      scope: ProjectOwnerScope
    ) {
      const folderId = await resolveChatFileFolderId(chatId, scope);
      return libraryService.uploadFiles(input, scope, folderId);
    },

    async uploadProjectSources(
      projectId: unknown,
      input: unknown,
      scope: ProjectOwnerScope
    ) {
      const folder = await ensureProjectFolder(projectId, scope);
      return libraryService.uploadFiles(input, scope, folder.id);
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
