import type { Chat } from "@/src/entities/models/chat";
import type { LibraryFileSummary } from "@/src/entities/models/library";
import type { Project, ProjectOwnerScope } from "@/src/entities/models/project";

/** Owner-checked Project and Source operations exposed by Project controller. */
export type ProjectService = {
  attachChat(
    projectId: unknown,
    chatId: unknown,
    scope: ProjectOwnerScope
  ): Promise<void>;
  createProject(input: unknown, scope: ProjectOwnerScope): Promise<Project>;
  deleteProject(projectId: unknown, scope: ProjectOwnerScope): Promise<void>;
  detachChat(chatId: unknown, scope: ProjectOwnerScope): Promise<void>;
  getProject(projectId: unknown, scope: ProjectOwnerScope): Promise<Project>;
  listProjectChats(
    projectId: unknown,
    scope: ProjectOwnerScope
  ): Promise<Chat[]>;
  listProjects(scope: ProjectOwnerScope): Promise<Project[]>;
  listProjectSources(
    projectId: unknown,
    scope: ProjectOwnerScope
  ): Promise<LibraryFileSummary[]>;
  addProjectSource(
    projectId: unknown,
    fileId: unknown,
    scope: ProjectOwnerScope
  ): Promise<void>;
  removeProjectSource(
    projectId: unknown,
    fileId: unknown,
    scope: ProjectOwnerScope
  ): Promise<void>;
  uploadProjectSources(
    projectId: unknown,
    input: unknown,
    scope: ProjectOwnerScope
  ): Promise<LibraryFileSummary[]>;
  updateProjectDetails(
    projectId: unknown,
    input: unknown,
    scope: ProjectOwnerScope
  ): Promise<Project>;
  updateProjectInstructions(
    projectId: unknown,
    instructions: unknown,
    scope: ProjectOwnerScope
  ): Promise<Project>;
};
