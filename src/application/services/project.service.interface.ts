import type { Project, ProjectOwnerScope } from "@/src/entities/models/project";

/** Owner-checked Project CRUD operations exposed by Project controller. */
export type ProjectService = {
  createProject(input: unknown, scope: ProjectOwnerScope): Promise<Project>;
  deleteProject(projectId: unknown, scope: ProjectOwnerScope): Promise<void>;
  getProject(projectId: unknown, scope: ProjectOwnerScope): Promise<Project>;
  listProjects(scope: ProjectOwnerScope): Promise<Project[]>;
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
