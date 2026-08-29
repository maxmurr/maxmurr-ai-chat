import assert from "node:assert/strict";
import { test } from "node:test";

import type { handleChatStream } from "@mastra/ai-sdk";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { CrashReporterService } from "@/src/application/services/crash-reporter.service.interface";
import type { InstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { LibraryService } from "@/src/application/services/library.service.interface";
import type { ProjectRepository } from "@/src/application/services/project-repository.service.interface";
import type { ProjectService } from "@/src/application/services/project.service.interface";
import { ChatAccessDeniedError } from "@/src/entities/errors/chat-errors";
import type { Chat, ChatMessage } from "@/src/entities/models/chat";
import type {
  ChatRequestContext,
  ChatStreamRequest,
} from "@/src/entities/models/chat-stream-request";
import type { Project } from "@/src/entities/models/project";
import {
  authorizeAndCreateStreamChat,
  createMastraChatStreamService,
} from "@/src/infrastructure/services/mastra-chat-stream.service";

const context: ChatRequestContext = {
  organizationId: "workspace-1",
  userId: "user-1",
};
const createdAt = new Date("2026-08-30T00:00:00.000Z");

function createStreamFixture(
  instructions: string,
  projectId: string | null,
  projectFolderId: string | null = null
) {
  let chat: Chat = {
    createdAt,
    id: "30000000-0000-4000-8000-000000000001",
    organizationId: context.organizationId,
    ownerId: context.userId,
    pinned: false,
    projectId,
    publicToken: null,
    title: "Project chat",
    updatedAt: createdAt,
    visibility: "private",
  };
  let project: Project = {
    createdAt,
    description: null,
    folderId: projectFolderId,
    id: "10000000-0000-4000-8000-000000000001",
    instructions,
    name: "Launch",
    organizationId: context.organizationId,
    ownerId: context.userId,
    pinned: false,
    updatedAt: createdAt,
  };
  let projectReads = 0;
  let sourceReads = 0;
  const savedMessages: ChatMessage[] = [];
  const streamedMessages: unknown[][] = [];
  const streamedSystems: (string | undefined)[] = [];
  const chatRepository = {
    async getChatById() {
      return chat;
    },
    async getChatMessages() {
      return [];
    },
    async isWorkspaceMember() {
      return true;
    },
    async saveMessage(_chatId: string, message: ChatMessage) {
      savedMessages.push(message);
    },
  } as unknown as ChatRepository;
  const projectRepository = {
    async getOwnedProject(id, scope) {
      projectReads += 1;
      return id === project.id &&
        scope.organizationId === project.organizationId &&
        scope.ownerId === project.ownerId
        ? project
        : null;
    },
  } as ProjectRepository;
  const libraryService = {
    async listLibrary() {
      sourceReads += 1;
      return {
        files: [
          {
            createdAt,
            folderId: projectFolderId,
            id: "20000000-0000-4000-8000-000000000001",
            mediaType: "text/plain",
            name: "private-source.txt",
            organizationId: context.organizationId,
            ownerId: context.userId,
            provenanceChatId: null,
            provenanceChatTitle: null,
            provenanceMessageId: null,
            size: 20,
          },
        ],
        folder: null,
        folders: [],
      };
    },
    async setChatFileProvenance() {},
  } as unknown as LibraryService;
  const projectService = {
    async resolveChatFileFolderId() {
      return null;
    },
  } as unknown as ProjectService;
  const crashReporterService: CrashReporterService = {
    report() {
      return "event-id";
    },
  };
  const instrumentationService = {
    instrumentServerAction: async (_name, _options, callback) => callback(),
    startSpan: (_options, callback) => callback(),
  } satisfies InstrumentationService;
  const streamChat = createMastraChatStreamService(
    chatRepository,
    projectRepository,
    libraryService,
    projectService,
    crashReporterService,
    instrumentationService,
    async (options) => {
      streamedMessages.push(options.params.messages);
      streamedSystems.push(options.params.system as string | undefined);
      return new ReadableStream() as unknown as Awaited<
        ReturnType<typeof handleChatStream>
      >;
    },
    () => {}
  );
  let messageNumber = 0;

  return {
    detachChat() {
      chat = { ...chat, projectId: null };
    },
    get projectReads() {
      return projectReads;
    },
    savedMessages,
    get sourceReads() {
      return sourceReads;
    },
    async sendMessage() {
      messageNumber += 1;
      return streamChat(
        {
          chatId: chat.id,
          message: {
            id: `user-${messageNumber}`,
            parts: [{ text: "Hello", type: "text" }],
            role: "user",
          },
          trigger: "submit-message",
        },
        context,
        new AbortController().signal
      );
    },
    setInstructions(nextInstructions: string) {
      project = { ...project, instructions: nextInstructions };
    },
    streamedMessages,
    streamedSystems,
  };
}

test("Project Chat streams current Custom Instructions as non-persisted system context", async () => {
  const fixture = createStreamFixture(
    "Answer in haiku.",
    "10000000-0000-4000-8000-000000000001"
  );

  await fixture.sendMessage();

  assert.deepEqual(fixture.streamedSystems, ["Answer in haiku."]);
  assert.deepEqual(
    fixture.savedMessages.map(({ role }) => role),
    ["user"]
  );
});

test("Project Sources never enter model provider messages", async () => {
  const fixture = createStreamFixture(
    "Answer briefly.",
    "10000000-0000-4000-8000-000000000001",
    "40000000-0000-4000-8000-000000000001"
  );

  await fixture.sendMessage();

  assert.equal(fixture.sourceReads, 0);
  assert.doesNotMatch(
    JSON.stringify(fixture.streamedMessages),
    /private-source\.txt/
  );
  assert.match(JSON.stringify(fixture.streamedMessages), /Hello/);
});

test("Project Chat with empty Custom Instructions streams no system context", async () => {
  const fixture = createStreamFixture(
    "   ",
    "10000000-0000-4000-8000-000000000001"
  );

  await fixture.sendMessage();

  assert.deepEqual(fixture.streamedSystems, [undefined]);
  assert.equal(fixture.projectReads, 1);
});

test("Chat without Project streams no system context or Project read", async () => {
  const fixture = createStreamFixture("Unused", null);

  await fixture.sendMessage();

  assert.deepEqual(fixture.streamedSystems, [undefined]);
  assert.equal(fixture.projectReads, 0);
});

test("Project instruction edits and Chat detach apply on next stream request", async () => {
  const fixture = createStreamFixture(
    "Old instruction",
    "10000000-0000-4000-8000-000000000001"
  );

  await fixture.sendMessage();
  fixture.setInstructions("Current instruction");
  await fixture.sendMessage();
  fixture.detachChat();
  await fixture.sendMessage();

  assert.deepEqual(fixture.streamedSystems, [
    "Old instruction",
    "Current instruction",
    undefined,
  ]);
  assert.equal(fixture.projectReads, 2);
});

const chatId = "6f1f429e-84f3-4a10-9f2c-58a1a7a8f001";
const projectId = "7f1f429e-84f3-4a10-9f2c-58a1a7a8f002";
const request: ChatStreamRequest = {
  chatId,
  message: {
    id: "message-1",
    parts: [{ text: "Plan launch", type: "text" }],
    role: "user",
  },
  projectId,
};

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    createdAt,
    description: null,
    folderId: null,
    id: projectId,
    instructions: "",
    name: "Launch",
    organizationId: context.organizationId,
    ownerId: context.userId,
    pinned: false,
    updatedAt: createdAt,
    ...overrides,
  };
}

function createChat(overrides: Partial<Chat> = {}): Chat {
  return {
    createdAt,
    id: chatId,
    organizationId: context.organizationId,
    ownerId: context.userId,
    pinned: false,
    projectId: null,
    publicToken: null,
    title: "Plan launch",
    updatedAt: createdAt,
    visibility: "private",
    ...overrides,
  };
}

function createRepositories(options?: {
  existingChat?: Chat;
  project?: Project;
}) {
  const createdChats: Parameters<ChatRepository["createChat"]>[0][] = [];
  const chatRepository = {
    async createChat(input: Parameters<ChatRepository["createChat"]>[0]) {
      createdChats.push(input);
      return createChat(input);
    },
    async getChatById() {
      return options?.existingChat ?? null;
    },
    async isWorkspaceMember() {
      return true;
    },
  };
  const projectRepository = {
    async getOwnedProject(
      id: string,
      scope: { organizationId: string; ownerId: string }
    ) {
      const project = options?.project;
      return project &&
        project.id === id &&
        project.organizationId === scope.organizationId &&
        project.ownerId === scope.ownerId
        ? project
        : null;
    },
  };

  return { chatRepository, createdChats, projectRepository };
}

test("new stream Chat binds to owned Project in active Workspace", async () => {
  const repositories = createRepositories({ project: createProject() });

  const result = await authorizeAndCreateStreamChat(
    repositories.chatRepository,
    repositories.projectRepository,
    request,
    context
  );

  assert.equal(result.created, true);
  assert.equal(result.chat.projectId, projectId);
  assert.deepEqual(repositories.createdChats, [
    {
      id: chatId,
      organizationId: context.organizationId,
      ownerId: context.userId,
      projectId,
      title: "Plan launch",
    },
  ]);
});

test("new stream Chat rejects unowned or wrong-Workspace Project before create", async () => {
  for (const project of [
    createProject({ ownerId: "user-2" }),
    createProject({ organizationId: "workspace-2" }),
  ]) {
    const repositories = createRepositories({ project });

    await assert.rejects(
      authorizeAndCreateStreamChat(
        repositories.chatRepository,
        repositories.projectRepository,
        request,
        context
      ),
      ChatAccessDeniedError
    );
    assert.deepEqual(repositories.createdChats, []);
  }
});

test("existing stream Chat cannot bind to different Project", async () => {
  const repositories = createRepositories({
    existingChat: createChat(),
    project: createProject(),
  });

  await assert.rejects(
    authorizeAndCreateStreamChat(
      repositories.chatRepository,
      repositories.projectRepository,
      request,
      context
    ),
    ChatAccessDeniedError
  );
  assert.deepEqual(repositories.createdChats, []);
});
