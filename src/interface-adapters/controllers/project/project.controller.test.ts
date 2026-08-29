import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  NewProject,
  ProjectDetailsUpdate,
  ProjectRepository,
} from "@/src/application/services/project-repository.service.interface";
import { ProjectAccessDeniedError } from "@/src/entities/errors/project-errors";
import type { Project, ProjectOwnerScope } from "@/src/entities/models/project";
import { createProjectController } from "@/src/interface-adapters/controllers/project/project.controller";

const ownerScope: ProjectOwnerScope = {
  organizationId: "workspace-1",
  ownerId: "user-1",
};
const otherOwnerScope: ProjectOwnerScope = {
  organizationId: "workspace-1",
  ownerId: "user-2",
};
const otherWorkspaceScope: ProjectOwnerScope = {
  organizationId: "workspace-2",
  ownerId: "user-1",
};
const createdAt = new Date("2026-08-29T00:00:00.000Z");
const updatedAt = new Date("2026-08-29T01:00:00.000Z");

class InMemoryProjectRepository implements ProjectRepository {
  projects: Project[] = [];

  async createProject(project: NewProject) {
    const created = { ...project, createdAt, updatedAt: createdAt };
    this.projects.push(created);
    return created;
  }

  async deleteOwnedProject(id: string, scope: ProjectOwnerScope) {
    const index = this.projects.findIndex(
      (project) => project.id === id && this.matches(project, scope)
    );
    if (index === -1) return false;
    this.projects.splice(index, 1);
    return true;
  }

  async getOwnedProject(id: string, scope: ProjectOwnerScope) {
    return (
      this.projects.find(
        (project) => project.id === id && this.matches(project, scope)
      ) ?? null
    );
  }

  async listOwnedProjects(scope: ProjectOwnerScope) {
    return this.projects.filter((project) => this.matches(project, scope));
  }

  async updateOwnedProjectDetails(
    id: string,
    details: ProjectDetailsUpdate,
    scope: ProjectOwnerScope
  ) {
    return this.updateProject(id, details, scope);
  }

  async updateOwnedProjectInstructions(
    id: string,
    instructions: string,
    scope: ProjectOwnerScope
  ) {
    return this.updateProject(id, { instructions }, scope);
  }

  private matches(project: Project, scope: ProjectOwnerScope) {
    return (
      project.organizationId === scope.organizationId &&
      project.ownerId === scope.ownerId
    );
  }

  private async updateProject(
    id: string,
    update: Partial<Project>,
    scope: ProjectOwnerScope
  ) {
    const project = await this.getOwnedProject(id, scope);
    if (!project) return null;
    const updated = { ...project, ...update, updatedAt };
    this.projects = this.projects.map((candidate) =>
      candidate === project ? updated : candidate
    );
    return updated;
  }
}

function seedForeignProjects(repository: InMemoryProjectRepository) {
  repository.projects = [
    {
      ...otherOwnerScope,
      createdAt,
      description: null,
      id: "10000000-0000-4000-8000-000000000001",
      instructions: "Other owner",
      name: "Other owner's Project",
      updatedAt: createdAt,
    },
    {
      ...otherWorkspaceScope,
      createdAt,
      description: null,
      id: "10000000-0000-4000-8000-000000000002",
      instructions: "Other workspace",
      name: "Other Workspace Project",
      updatedAt: createdAt,
    },
  ];
}

test("Project CRUD persists details and supports setting and clearing instructions", async () => {
  const repository = new InMemoryProjectRepository();
  const controller = createProjectController(repository);

  const project = await controller.createProject(
    { description: "  ", name: "  Pricing revamp  " },
    ownerScope
  );
  assert.partialDeepStrictEqual(project, {
    ...ownerScope,
    description: null,
    instructions: "",
    name: "Pricing revamp",
  });
  assert.deepEqual(
    (await controller.listProjects(ownerScope)).map(({ id }) => id),
    [project.id]
  );
  assert.equal(
    (await controller.getProject(project.id, ownerScope)).id,
    project.id
  );

  const renamed = await controller.updateProjectDetails(
    project.id,
    { description: "Packaging and billing", name: "Pricing launch" },
    ownerScope
  );
  assert.partialDeepStrictEqual(renamed, {
    description: "Packaging and billing",
    id: project.id,
    name: "Pricing launch",
  });

  const withInstructions = await controller.updateProjectInstructions(
    project.id,
    "  Prefer concrete numbers.  ",
    ownerScope
  );
  assert.equal(withInstructions.instructions, "Prefer concrete numbers.");
  const cleared = await controller.updateProjectInstructions(
    project.id,
    "",
    ownerScope
  );
  assert.equal(cleared.instructions, "");

  const withoutDescription = await controller.updateProjectDetails(
    project.id,
    { description: "", name: "Pricing launch" },
    ownerScope
  );
  assert.equal(withoutDescription.description, null);

  await controller.deleteProject(project.id, ownerScope);
  assert.deepEqual(await controller.listProjects(ownerScope), []);
});

test("Project rejects same-Workspace access by another owner", async () => {
  const repository = new InMemoryProjectRepository();
  seedForeignProjects(repository);
  const controller = createProjectController(repository);
  const foreignProjectId = repository.projects[0].id;

  assert.deepEqual(await controller.listProjects(ownerScope), []);
  await assert.rejects(
    controller.getProject(foreignProjectId, ownerScope),
    ProjectAccessDeniedError
  );
  await assert.rejects(
    controller.updateProjectDetails(
      foreignProjectId,
      { description: "stolen", name: "stolen" },
      ownerScope
    ),
    ProjectAccessDeniedError
  );
  await assert.rejects(
    controller.deleteProject(foreignProjectId, ownerScope),
    ProjectAccessDeniedError
  );
});

test("Project rejects same-owner access from another Workspace", async () => {
  const repository = new InMemoryProjectRepository();
  seedForeignProjects(repository);
  const controller = createProjectController(repository);
  const foreignProjectId = repository.projects[1].id;

  assert.deepEqual(await controller.listProjects(ownerScope), []);
  await assert.rejects(
    controller.getProject(foreignProjectId, ownerScope),
    ProjectAccessDeniedError
  );
  await assert.rejects(
    controller.updateProjectInstructions(
      foreignProjectId,
      "stolen",
      ownerScope
    ),
    ProjectAccessDeniedError
  );
  await assert.rejects(
    controller.deleteProject(foreignProjectId, ownerScope),
    ProjectAccessDeniedError
  );
});
