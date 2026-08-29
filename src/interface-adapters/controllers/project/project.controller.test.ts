import assert from "node:assert/strict";
import { test } from "node:test";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type {
  NewProject,
  ProjectDetailsUpdate,
  ProjectRepository,
} from "@/src/application/services/project-repository.service.interface";
import { ProjectAccessDeniedError } from "@/src/entities/errors/project-errors";
import type { Chat } from "@/src/entities/models/chat";
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

class InMemoryChatRepository {
  chats: Chat[] = [];
  deletedChatIds: string[] = [];

  repository = {
    deleteChat: async (chatId: string) => {
      this.deletedChatIds.push(chatId);
      this.chats = this.chats.filter((chat) => chat.id !== chatId);
    },
    getChatById: async (chatId: string) =>
      this.chats.find((chat) => chat.id === chatId) ?? null,
    listChatsByProject: async (projectId: string) =>
      this.chats.filter((chat) => chat.projectId === projectId),
    updateChatProject: async (chatId: string, projectId: string | null) => {
      this.chats = this.chats.map((chat) =>
        chat.id === chatId ? { ...chat, projectId } : chat
      );
    },
  } as ChatRepository;
}

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

function createChat(
  id: string,
  scope: ProjectOwnerScope,
  projectId: string | null = null
): Chat {
  return {
    ...scope,
    createdAt,
    id,
    pinned: false,
    projectId,
    publicToken: null,
    title: "Chat",
    updatedAt,
    visibility: "private",
  };
}

function createController(repository: InMemoryProjectRepository) {
  const chats = new InMemoryChatRepository();
  return {
    chats,
    controller: createProjectController(repository, chats.repository),
  };
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
  const { controller } = createController(repository);

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
  const { controller } = createController(repository);
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
  const { controller } = createController(repository);
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

test("Project attaches, moves, and detaches only owner Chats in active Workspace", async () => {
  const repository = new InMemoryProjectRepository();
  const { chats, controller } = createController(repository);
  const firstProject = await controller.createProject(
    { description: "", name: "First" },
    ownerScope
  );
  const secondProject = await controller.createProject(
    { description: "", name: "Second" },
    ownerScope
  );
  const chatId = "30000000-0000-4000-8000-000000000001";
  const foreignOwnerChatId = "30000000-0000-4000-8000-000000000002";
  const foreignWorkspaceChatId = "30000000-0000-4000-8000-000000000003";
  chats.chats = [
    createChat(chatId, ownerScope, firstProject.id),
    createChat(foreignOwnerChatId, otherOwnerScope),
    createChat(foreignWorkspaceChatId, otherWorkspaceScope),
  ];

  await controller.attachChat(secondProject.id, chatId, ownerScope);
  assert.equal(chats.chats[0].projectId, secondProject.id);
  assert.deepEqual(
    (await controller.listProjectChats(secondProject.id, ownerScope)).map(
      ({ id }) => id
    ),
    [chatId]
  );

  await controller.detachChat(chatId, ownerScope);
  assert.equal(chats.chats[0].projectId, null);
  await assert.rejects(
    controller.attachChat(secondProject.id, foreignOwnerChatId, ownerScope),
    ProjectAccessDeniedError
  );
  await assert.rejects(
    controller.attachChat(secondProject.id, foreignWorkspaceChatId, ownerScope),
    ProjectAccessDeniedError
  );
  await assert.rejects(
    controller.attachChat(
      "10000000-0000-4000-8000-000000000099",
      chatId,
      ownerScope
    ),
    ProjectAccessDeniedError
  );
});

test("deleting Project deletes its Chats through Chat repository", async () => {
  const repository = new InMemoryProjectRepository();
  const { chats, controller } = createController(repository);
  const project = await controller.createProject(
    { description: "", name: "Launch" },
    ownerScope
  );
  const projectChatIds = [
    "30000000-0000-4000-8000-000000000011",
    "30000000-0000-4000-8000-000000000012",
  ];
  const unrelatedChatId = "30000000-0000-4000-8000-000000000013";
  chats.chats = [
    ...projectChatIds.map((id) => createChat(id, ownerScope, project.id)),
    createChat(unrelatedChatId, ownerScope),
  ];

  await controller.deleteProject(project.id, ownerScope);

  assert.deepEqual(chats.deletedChatIds, projectChatIds);
  assert.deepEqual(
    chats.chats.map(({ id }) => id),
    [unrelatedChatId]
  );
  assert.deepEqual(await controller.listProjects(ownerScope), []);
});
