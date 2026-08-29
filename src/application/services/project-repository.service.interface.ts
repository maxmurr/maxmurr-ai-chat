import type { LibraryFileSummary } from "@/src/entities/models/library";
import type { Project, ProjectOwnerScope } from "@/src/entities/models/project";

/** Values accepted when creating one owner-scoped Project. */
export type NewProject = ProjectOwnerScope & {
  readonly description: string | null;
  readonly folderId: string | null;
  readonly id: string;
  readonly instructions: string;
  readonly name: string;
  readonly pinned: boolean;
};

/** Values accepted by atomic owner-scoped Project detail updates. */
export type ProjectDetailsUpdate = {
  readonly description: string | null;
  readonly name: string;
};

/** Persists owner-private Projects and their Library File Source links. */
export type ProjectRepository = {
  addOwnedProjectSources(
    projectId: string,
    fileIds: readonly string[],
    scope: ProjectOwnerScope
  ): Promise<boolean>;
  createProject(project: NewProject): Promise<Project>;
  deleteOwnedProject(
    projectId: string,
    scope: ProjectOwnerScope
  ): Promise<boolean>;
  getOwnedProject(
    projectId: string,
    scope: ProjectOwnerScope
  ): Promise<Project | null>;
  listOwnedProjects(scope: ProjectOwnerScope): Promise<Project[]>;
  listOwnedProjectSources(
    projectId: string,
    scope: ProjectOwnerScope
  ): Promise<LibraryFileSummary[]>;
  removeOwnedProjectSource(
    projectId: string,
    fileId: string,
    scope: ProjectOwnerScope
  ): Promise<boolean>;
  updateOwnedProjectDetails(
    projectId: string,
    details: ProjectDetailsUpdate,
    scope: ProjectOwnerScope
  ): Promise<Project | null>;
  updateOwnedProjectInstructions(
    projectId: string,
    instructions: string,
    scope: ProjectOwnerScope
  ): Promise<Project | null>;
  updateOwnedProjectPinned(
    projectId: string,
    pinned: boolean,
    scope: ProjectOwnerScope
  ): Promise<Project | null>;
  claimOwnedProjectFolderId(
    projectId: string,
    expectedFolderId: string | null,
    folderId: string,
    scope: ProjectOwnerScope
  ): Promise<Project | null>;
};
