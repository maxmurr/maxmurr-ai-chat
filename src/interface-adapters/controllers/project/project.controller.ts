import { z } from "zod";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { ProjectRepository } from "@/src/application/services/project-repository.service.interface";
import type { LibraryService } from "@/src/application/services/library.service.interface";
import type { ProjectService } from "@/src/application/services/project.service.interface";
import { ChatStreamConflictError } from "@/src/entities/errors/chat-errors";
import { LibraryAccessDeniedError } from "@/src/entities/errors/library-errors";
import {
  InvalidProjectRequestError,
  ProjectAccessDeniedError,
} from "@/src/entities/errors/project-errors";
import type { ProjectOwnerScope } from "@/src/entities/models/project";

const projectIdSchema = z.uuid();
const projectSourceFileIdsSchema = z.array(z.uuid()).max(100);
const projectNameSchema = z.string().trim().min(1).max(100);
const projectDescriptionSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((description) => description || null);
const projectInstructionsSchema = z.string().trim().max(10_000);
const projectPinnedSchema = z.boolean();
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
  "createFolder" | "deleteFolder" | "listLibrary" | "uploadFiles"
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

  async function linkProjectSourceFiles(
    projectId: string,
    fileIds: readonly string[],
    scope: ProjectOwnerScope
  ) {
    if (
      !(await projectRepository.addOwnedProjectSources(
        projectId,
        fileIds,
        scope
      ))
    ) {
      throw new ProjectAccessDeniedError();
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

    const folder = await libraryService.createFolder(ownedProject.name, scope);
    const claimedProject = await projectRepository.claimOwnedProjectFolderId(
      ownedProject.id,
      ownedProject.folderId,
      folder.id,
      scope
    );

    if (claimedProject) return folder;

    const winningProject = await projectRepository.getOwnedProject(
      ownedProject.id,
      scope
    );
    await libraryService.deleteFolder(folder.id, scope);
    const winningFolderId = requireOwnedProject(winningProject).folderId;

    if (winningFolderId) {
      try {
        const listing = await libraryService.listLibrary(
          winningFolderId,
          scope
        );
        if (listing.folder) return listing.folder;
      } catch (error) {
        if (!(error instanceof LibraryAccessDeniedError)) throw error;
      }
    }

    return ensureProjectFolder(ownedProject.id, scope);
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
    async addChatFilesAsProjectSources(
      chatId: unknown,
      fileIds: unknown,
      scope: ProjectOwnerScope
    ) {
      const ids = parseProjectInput(projectSourceFileIdsSchema, fileIds);
      const chat = await requireOwnedChat(chatId, scope);

      if (chat.projectId) {
        await linkProjectSourceFiles(chat.projectId, ids, scope);
      }
    },

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
        pinned: false,
      });
    },

    async deleteProject(projectId: unknown, scope: ProjectOwnerScope) {
      const project = await getOwnedProject(projectId, scope);
      const projectChats = await chatRepository.listChatsByProject(project.id);

      if (projectChats.some((chat) => chat.activeStreamId !== null)) {
        throw new ChatStreamConflictError();
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
      const project = await getOwnedProject(projectId, scope);
      return projectRepository.listOwnedProjectSources(project.id, scope);
    },

    async pinProject(
      projectId: unknown,
      pinned: unknown,
      scope: ProjectOwnerScope
    ) {
      const id = parseProjectInput(projectIdSchema, projectId);
      const value = parseProjectInput(projectPinnedSchema, pinned);
      return requireOwnedProject(
        await projectRepository.updateOwnedProjectPinned(id, value, scope)
      );
    },

    async addProjectSource(
      projectId: unknown,
      fileId: unknown,
      scope: ProjectOwnerScope
    ) {
      const project = await getOwnedProject(projectId, scope);
      const id = parseProjectInput(projectIdSchema, fileId);
      await linkProjectSourceFiles(project.id, [id], scope);
    },

    async removeProjectSource(
      projectId: unknown,
      fileId: unknown,
      scope: ProjectOwnerScope
    ) {
      const project = await getOwnedProject(projectId, scope);
      const id = parseProjectInput(projectIdSchema, fileId);

      if (
        !(await projectRepository.removeOwnedProjectSource(
          project.id,
          id,
          scope
        ))
      ) {
        throw new ProjectAccessDeniedError();
      }
    },

    resolveChatFileFolderId,

    async uploadChatFiles(
      chatId: unknown,
      input: unknown,
      scope: ProjectOwnerScope
    ) {
      const chat = await requireOwnedChat(chatId, scope);
      const folderId = chat.projectId
        ? (await ensureProjectFolder(chat.projectId, scope)).id
        : null;
      const files = await libraryService.uploadFiles(input, scope, folderId);

      if (chat.projectId) {
        await linkProjectSourceFiles(
          chat.projectId,
          files.map(({ id }) => id),
          scope
        );
      }

      return files;
    },

    async uploadProjectSources(
      projectId: unknown,
      input: unknown,
      scope: ProjectOwnerScope
    ) {
      const project = await getOwnedProject(projectId, scope);
      const folder = await ensureProjectFolder(project.id, scope);
      const files = await libraryService.uploadFiles(input, scope, folder.id);
      await linkProjectSourceFiles(
        project.id,
        files.map(({ id }) => id),
        scope
      );
      return files;
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
