import assert from "node:assert/strict";
import { test } from "node:test";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { LibraryService } from "@/src/application/services/library.service.interface";
import type {
  NewProject,
  ProjectDetailsUpdate,
  ProjectRepository,
} from "@/src/application/services/project-repository.service.interface";
import { LibraryAccessDeniedError } from "@/src/entities/errors/library-errors";
import {
  InvalidProjectRequestError,
  ProjectAccessDeniedError,
} from "@/src/entities/errors/project-errors";
import type { Chat } from "@/src/entities/models/chat";
import type {
  LibraryFileSummary,
  LibraryFolder,
} from "@/src/entities/models/library";
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

class InMemoryProjectSourceLibrary implements Pick<
  LibraryService,
  "createFolder" | "deleteFolder" | "listLibrary" | "moveFile" | "uploadFiles"
> {
  deletedFolderIds: string[] = [];
  files: LibraryFileSummary[] = [];
  folders: LibraryFolder[] = [];
  foldersCreated = 0;

  async createFolder(name: unknown, scope: ProjectOwnerScope) {
    this.foldersCreated += 1;
    const folder = {
      ...scope,
      createdAt,
      id: `10000000-0000-4000-8000-${String(this.foldersCreated).padStart(12, "0")}`,
      name: String(name),
    };
    this.folders.push(folder);
    return folder;
  }

  async deleteFolder(folderId: unknown, scope: ProjectOwnerScope) {
    const id = String(folderId);
    const folder = this.folders.find(
      (candidate) => candidate.id === id && this.matches(candidate, scope)
    );
    if (!folder) throw new LibraryAccessDeniedError();
    this.deletedFolderIds.push(id);
    this.folders = this.folders.filter((candidate) => candidate !== folder);
    this.files = this.files.filter((file) => file.folderId !== id);
  }

  async listLibrary(folderId: unknown, scope: ProjectOwnerScope) {
    const id = folderId === null ? null : String(folderId);
    const folder = id
      ? (this.folders.find(
          (candidate) => candidate.id === id && this.matches(candidate, scope)
        ) ?? null)
      : null;

    if (id && !folder) throw new LibraryAccessDeniedError();

    return {
      files: this.files.filter(
        (file) => file.folderId === id && this.matches(file, scope)
      ),
      folder,
      folders: this.folders.filter((candidate) =>
        this.matches(candidate, scope)
      ),
    };
  }

  async moveFile(fileId: unknown, folderId: unknown, scope: ProjectOwnerScope) {
    const file = this.files.find(
      (candidate) =>
        candidate.id === String(fileId) && this.matches(candidate, scope)
    );
    if (!file) throw new LibraryAccessDeniedError();

    const targetFolderId = folderId === null ? null : String(folderId);
    if (
      targetFolderId &&
      !this.folders.some(
        (folder) => folder.id === targetFolderId && this.matches(folder, scope)
      )
    ) {
      throw new LibraryAccessDeniedError();
    }

    this.files = this.files.map((candidate) =>
      candidate === file
        ? { ...candidate, folderId: targetFolderId }
        : candidate
    );
  }

  async uploadFiles(
    input: unknown,
    scope: ProjectOwnerScope,
    targetFolderId?: string | null
  ) {
    const files = input as {
      bytes: Uint8Array;
      mediaType: string;
      name: string;
    }[];
    const uploaded = files.map((file, index): LibraryFileSummary => ({
      ...scope,
      createdAt,
      folderId: targetFolderId ?? null,
      id: `20000000-0000-4000-8000-${String(this.files.length + index + 1).padStart(12, "0")}`,
      mediaType: file.mediaType,
      name: file.name,
      provenanceChatId: null,
      provenanceChatTitle: null,
      provenanceMessageId: null,
      size: file.bytes.byteLength,
    }));
    this.files.push(...uploaded);
    return uploaded;
  }

  private matches(
    value: { organizationId: string; ownerId: string },
    scope: ProjectOwnerScope
  ) {
    return (
      value.organizationId === scope.organizationId &&
      value.ownerId === scope.ownerId
    );
  }
}

class InMemoryProjectRepository implements ProjectRepository {
  getLibraryFiles: () => LibraryFileSummary[] = () => [];
  projects: Project[] = [];
  sourceFileIdsByProject = new Map<string, Set<string>>();

  async addOwnedProjectSources(
    projectId: string,
    fileIds: readonly string[],
    scope: ProjectOwnerScope
  ) {
    const project = await this.getOwnedProject(projectId, scope);
    const ownedFileIds = new Set(
      this.getLibraryFiles()
        .filter((file) => this.matches(file, scope))
        .map(({ id }) => id)
    );
    if (!project || fileIds.some((id) => !ownedFileIds.has(id))) return false;

    const sourceFileIds =
      this.sourceFileIdsByProject.get(projectId) ?? new Set<string>();
    for (const id of fileIds) sourceFileIds.add(id);
    this.sourceFileIdsByProject.set(projectId, sourceFileIds);
    return true;
  }

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
    this.sourceFileIdsByProject.delete(id);
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

  async listOwnedProjectSources(projectId: string, scope: ProjectOwnerScope) {
    const project = await this.getOwnedProject(projectId, scope);
    if (!project) return [];

    const sourceFileIds = this.sourceFileIdsByProject.get(projectId);
    return sourceFileIds
      ? this.getLibraryFiles().filter(
          (file) => sourceFileIds.has(file.id) && this.matches(file, scope)
        )
      : [];
  }

  async removeOwnedProjectSource(
    projectId: string,
    fileId: string,
    scope: ProjectOwnerScope
  ) {
    const project = await this.getOwnedProject(projectId, scope);
    return project
      ? (this.sourceFileIdsByProject.get(projectId)?.delete(fileId) ?? false)
      : false;
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

  async updateOwnedProjectPinned(
    id: string,
    pinned: boolean,
    scope: ProjectOwnerScope
  ) {
    return this.updateProject(id, { pinned }, scope);
  }

  async claimOwnedProjectFolderId(
    id: string,
    expectedFolderId: string | null,
    folderId: string,
    scope: ProjectOwnerScope
  ) {
    const project = this.projects.find(
      (candidate) => candidate.id === id && this.matches(candidate, scope)
    );
    if (!project || project.folderId !== expectedFolderId) return null;
    const updated = { ...project, folderId, updatedAt };
    this.projects = this.projects.map((candidate) =>
      candidate === project ? updated : candidate
    );
    return updated;
  }

  private matches(
    value: { organizationId: string; ownerId: string },
    scope: ProjectOwnerScope
  ) {
    return (
      value.organizationId === scope.organizationId &&
      value.ownerId === scope.ownerId
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

function createController(
  repository: InMemoryProjectRepository,
  library = new InMemoryProjectSourceLibrary()
) {
  const chats = new InMemoryChatRepository();
  repository.getLibraryFiles = () => library.files;
  return {
    chats,
    controller: createProjectController(repository, chats.repository, library),
    library,
  };
}

function seedForeignProjects(repository: InMemoryProjectRepository) {
  repository.projects = [
    {
      ...otherOwnerScope,
      createdAt,
      description: null,
      folderId: null,
      id: "10000000-0000-4000-8000-000000000001",
      instructions: "Other owner",
      name: "Other owner's Project",
      pinned: false,
      updatedAt: createdAt,
    },
    {
      ...otherWorkspaceScope,
      createdAt,
      description: null,
      folderId: null,
      id: "10000000-0000-4000-8000-000000000002",
      instructions: "Other workspace",
      name: "Other Workspace Project",
      pinned: false,
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
    pinned: false,
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

  const pinned = await controller.pinProject(project.id, true, ownerScope);
  assert.equal(pinned.pinned, true);
  assert.equal(
    (await controller.pinProject(project.id, false, ownerScope)).pinned,
    false
  );
  await assert.rejects(
    controller.pinProject(project.id, "yes", ownerScope),
    InvalidProjectRequestError
  );

  const withoutDescription = await controller.updateProjectDetails(
    project.id,
    { description: "", name: "Pricing launch" },
    ownerScope
  );
  assert.equal(withoutDescription.description, null);

  await controller.deleteProject(project.id, ownerScope);
  assert.deepEqual(await controller.listProjects(ownerScope), []);
});

test("Project Source links preserve Library placement when added and removed", async () => {
  const repository = new InMemoryProjectRepository();
  const library = new InMemoryProjectSourceLibrary();
  const { controller } = createController(repository, library);
  const project = await controller.createProject(
    { description: "", name: "Pricing revamp" },
    ownerScope
  );
  const existingFolder = await library.createFolder("Research", ownerScope);
  const fileId = "20000000-0000-4000-8000-000000000099";
  library.files.push({
    ...ownerScope,
    createdAt,
    folderId: existingFolder.id,
    id: fileId,
    mediaType: "application/pdf",
    name: "research.pdf",
    provenanceChatId: null,
    provenanceChatTitle: null,
    provenanceMessageId: null,
    size: 42,
  });

  await controller.addProjectSource(project.id, fileId, ownerScope);

  assert.equal(library.folders.length, 1);
  assert.equal(
    library.files.find(({ id }) => id === fileId)?.folderId,
    existingFolder.id
  );
  assert.equal(
    (await controller.getProject(project.id, ownerScope)).folderId,
    null
  );
  assert.deepEqual(
    (await controller.listProjectSources(project.id, ownerScope)).map(
      ({ id }) => id
    ),
    [fileId]
  );

  await controller.removeProjectSource(project.id, fileId, ownerScope);

  assert.equal(
    library.files.find(({ id }) => id === fileId)?.folderId,
    existingFolder.id
  );
  assert.deepEqual(
    await controller.listProjectSources(project.id, ownerScope),
    []
  );
});

test("Project Source uploads lazily create, freeze, and recreate Project Folder", async () => {
  const repository = new InMemoryProjectRepository();
  const library = new InMemoryProjectSourceLibrary();
  const { controller } = createController(repository, library);
  const project = await controller.createProject(
    { description: "", name: "Pricing revamp" },
    ownerScope
  );

  const [uploaded] = await controller.uploadProjectSources(
    project.id,
    [
      {
        bytes: new TextEncoder().encode("brief"),
        mediaType: "text/plain",
        name: "brief.txt",
      },
    ],
    ownerScope
  );
  const firstFolder = library.folders[0];
  assert.equal(firstFolder.name, "Pricing revamp");
  assert.equal(uploaded.folderId, firstFolder.id);
  assert.deepEqual(
    (await controller.listProjectSources(project.id, ownerScope)).map(
      ({ id }) => id
    ),
    [uploaded.id]
  );

  await controller.updateProjectDetails(
    project.id,
    { description: "", name: "Pricing launch" },
    ownerScope
  );
  await library.deleteFolder(firstFolder.id, ownerScope);

  const [recreatedUpload] = await controller.uploadProjectSources(
    project.id,
    [
      {
        bytes: new TextEncoder().encode("cohorts"),
        mediaType: "text/csv",
        name: "cohorts.csv",
      },
    ],
    ownerScope
  );
  const recreatedFolder = library.folders[0];
  assert.notEqual(recreatedFolder.id, firstFolder.id);
  assert.equal(recreatedFolder.name, "Pricing launch");
  assert.equal(recreatedUpload.folderId, recreatedFolder.id);
  assert.equal(
    (await controller.getProject(project.id, ownerScope)).folderId,
    recreatedFolder.id
  );
  assert.deepEqual(
    (await controller.listProjectSources(project.id, ownerScope)).map(
      ({ id }) => id
    ),
    [recreatedUpload.id]
  );
});

test("concurrent Sources share one claimed Project Folder", async () => {
  const repository = new InMemoryProjectRepository();
  const { controller, library } = createController(repository);
  const project = await controller.createProject(
    { description: "", name: "Launch" },
    ownerScope
  );
  const inputs = ["first.txt", "second.txt"].map((name) => [
    {
      bytes: new TextEncoder().encode(name),
      mediaType: "text/plain",
      name,
    },
  ]);

  const [[first], [second]] = await Promise.all(
    inputs.map((input) =>
      controller.uploadProjectSources(project.id, input, ownerScope)
    )
  );

  assert.equal(first.folderId, second.folderId);
  assert.equal(library.folders.length, 1);
  assert.equal(library.deletedFolderIds.length, 1);
  assert.equal(
    (await controller.getProject(project.id, ownerScope)).folderId,
    first.folderId
  );
});

test("Chat uploads route to lazy Project Folder and plain Chats stay at root", async () => {
  const repository = new InMemoryProjectRepository();
  const { chats, controller, library } = createController(repository);
  const project = await controller.createProject(
    { description: "", name: "Launch" },
    ownerScope
  );
  const projectChatId = "30000000-0000-4000-8000-000000000021";
  const plainChatId = "30000000-0000-4000-8000-000000000022";
  const foreignChatId = "30000000-0000-4000-8000-000000000023";
  chats.chats = [
    createChat(projectChatId, ownerScope, project.id),
    createChat(plainChatId, ownerScope),
    createChat(foreignChatId, otherOwnerScope, project.id),
  ];
  const clientChosenFolderId = "10000000-0000-4000-8000-000000000099";
  const input = [
    {
      bytes: new TextEncoder().encode("notes"),
      folderId: clientChosenFolderId,
      mediaType: "text/plain",
      name: "notes.txt",
    },
  ];

  const [projectUpload] = await controller.uploadChatFiles(
    projectChatId,
    input,
    ownerScope
  );
  const firstFolder = library.folders[0];
  assert.equal(firstFolder.name, "Launch");
  assert.equal(projectUpload.folderId, firstFolder.id);
  assert.notEqual(projectUpload.folderId, clientChosenFolderId);
  assert.deepEqual(
    (await controller.listProjectSources(project.id, ownerScope)).map(
      ({ id }) => id
    ),
    [projectUpload.id]
  );

  const generatedFileId = "20000000-0000-4000-8000-000000000099";
  library.files.push({
    ...ownerScope,
    createdAt,
    folderId: firstFolder.id,
    id: generatedFileId,
    mediaType: "text/plain",
    name: "generated.txt",
    provenanceChatId: projectChatId,
    provenanceChatTitle: "Chat",
    provenanceMessageId: "assistant-message",
    size: 9,
  });
  await controller.addChatFilesAsProjectSources(
    projectChatId,
    [generatedFileId],
    ownerScope
  );
  assert.deepEqual(
    (await controller.listProjectSources(project.id, ownerScope)).map(
      ({ id }) => id
    ),
    [projectUpload.id, generatedFileId]
  );

  await library.deleteFolder(firstFolder.id, ownerScope);
  const [recreatedUpload] = await controller.uploadChatFiles(
    projectChatId,
    input,
    ownerScope
  );
  assert.notEqual(recreatedUpload.folderId, firstFolder.id);
  assert.equal(library.folders.length, 1);

  const [plainUpload] = await controller.uploadChatFiles(
    plainChatId,
    input,
    ownerScope
  );
  assert.equal(plainUpload.folderId, null);
  await assert.rejects(
    controller.uploadChatFiles(foreignChatId, input, ownerScope),
    ProjectAccessDeniedError
  );
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
    controller.pinProject(foreignProjectId, true, ownerScope),
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

test("deleting Project delegates one database-cascading Project delete", async () => {
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

  assert.deepEqual(chats.deletedChatIds, []);
  assert.deepEqual(await controller.listProjects(ownerScope), []);
});
