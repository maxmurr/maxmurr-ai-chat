import assert from "node:assert/strict";
import { test } from "node:test";

import type { handleChatStream } from "@mastra/ai-sdk";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { ChatStreamStore } from "@/src/application/services/chat-stream-store.service.interface";
import type { CrashReporterService } from "@/src/application/services/crash-reporter.service.interface";
import type { InstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { LibraryService } from "@/src/application/services/library.service.interface";
import type { ProjectRepository } from "@/src/application/services/project-repository.service.interface";
import type { ProjectService } from "@/src/application/services/project.service.interface";
import {
  ChatAccessDeniedError,
  ChatStreamConflictError,
} from "@/src/entities/errors/chat-errors";
import type { Chat, ChatMessage } from "@/src/entities/models/chat";
import {
  chatModelOptions,
  DEFAULT_CHAT_MODEL_ID,
  type ChatModelId,
} from "@/src/entities/models/chat-model";
import type {
  ChatRequestContext,
  ChatStreamRequest,
} from "@/src/entities/models/chat-stream-request";
import type { Project } from "@/src/entities/models/project";
import type { findSlackLinkedThread } from "@/src/infrastructure/ai/mastra/mastra-runtime";
import {
  authorizeAndCreateStreamChat,
  createMastraChatStreamService,
} from "@/src/infrastructure/services/mastra-chat-stream.service";

const context: ChatRequestContext = {
  organizationId: "workspace-1",
  userAvatarUrl: "https://example.com/alex.png",
  userDisplayName: "Alex",
  userId: "user-1",
};
const createdAt = new Date("2026-08-30T00:00:00.000Z");

function createStreamFixture(
  instructions: string,
  projectId: string | null,
  projectFolderId: string | null = null,
  slackThread: Awaited<ReturnType<typeof findSlackLinkedThread>> = null,
  initialHistory: ChatMessage[] = []
) {
  let chat: Chat = {
    activeStreamId: null,
    createdAt,
    hasUnreadResponse: false,
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
  let claimAllowed = true;
  let projectReadFinished = false;
  let projectReads = 0;
  let sourceReads = 0;
  const deletedMessagePivots: {
    inclusive: boolean;
    messageId: string;
  }[] = [];
  const savedMessages: ChatMessage[] = [];
  const streamedActiveTools: unknown[] = [];
  const streamedMemories: unknown[] = [];
  const streamedMessages: unknown[][] = [];
  const streamedModels: unknown[] = [];
  const streamedSystems: (string | undefined)[] = [];
  const chatRepository = {
    async claimChatResponseStream() {
      return claimAllowed;
    },
    async deleteMessagesFrom(
      _chatId: string,
      pivot: { inclusive: boolean; messageId: string }
    ) {
      deletedMessagePivots.push(pivot);
    },
    async finishChatResponseStream() {},
    async getChatById() {
      return chat;
    },
    async getChatMessages() {
      if (chat.projectId) assert.equal(projectReadFinished, false);
      return initialHistory;
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
      projectReadFinished = false;
      projectReads += 1;
      await Promise.resolve();
      projectReadFinished = true;
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
  const chatStreamStore: ChatStreamStore = {
    async cancelChatStream() {},
    async createChatStream() {},
    async resumeChatStream() {
      return null;
    },
  };
  const streamChat = createMastraChatStreamService(
    chatRepository,
    chatStreamStore,
    projectRepository,
    libraryService,
    projectService,
    crashReporterService,
    instrumentationService,
    async (options) => {
      streamedActiveTools.push(options.params.activeTools);
      streamedMemories.push(options.params.memory);
      streamedMessages.push(options.params.messages);
      streamedModels.push(
        options.params.requestContext?.get("chat-assistant-model")
      );
      streamedSystems.push(options.params.system as string | undefined);
      return new ReadableStream() as unknown as Awaited<
        ReturnType<typeof handleChatStream>
      >;
    },
    () => {},
    async () => slackThread
  );
  let messageNumber = 0;

  return {
    get deletedMessagePivots() {
      return deletedMessagePivots;
    },
    denyStreamClaim() {
      claimAllowed = false;
    },
    detachChat() {
      chat = { ...chat, projectId: null };
    },
    get projectReads() {
      return projectReads;
    },
    async editMessage(messageId: string, text: string) {
      messageNumber += 1;
      return streamChat(
        {
          chatId: chat.id,
          message: {
            id: messageId,
            parts: [{ text, type: "text" }],
            role: "user",
          },
          messageId,
          modelId: DEFAULT_CHAT_MODEL_ID,
          streamId: `40000000-0000-4000-8000-${messageNumber
            .toString()
            .padStart(12, "0")}`,
          trigger: "regenerate-message",
          webSearchEnabled: false,
        },
        context
      );
    },
    savedMessages,
    get sourceReads() {
      return sourceReads;
    },
    async sendMessage(
      modelId: ChatModelId = DEFAULT_CHAT_MODEL_ID,
      webSearchEnabled = false,
      metadata?: unknown
    ) {
      messageNumber += 1;
      return streamChat(
        {
          chatId: chat.id,
          message: {
            id: `user-${messageNumber}`,
            ...(metadata === undefined ? {} : { metadata }),
            parts: [{ text: "Hello", type: "text" }],
            role: "user",
          },
          modelId,
          streamId: `40000000-0000-4000-8000-${messageNumber
            .toString()
            .padStart(12, "0")}`,
          trigger: "submit-message",
          webSearchEnabled,
        },
        context
      );
    },
    setInstructions(nextInstructions: string) {
      project = { ...project, instructions: nextInstructions };
    },
    streamedActiveTools,
    streamedMemories,
    streamedMessages,
    streamedModels,
    streamedSystems,
  };
}

test("Slack-linked Chat posts the web turn with its user identity and shared thread memory", async () => {
  const posted: {
    avatarUrl?: string;
    displayName: string;
    text: string;
  }[] = [];
  const fixture = createStreamFixture("", null, null, {
    async postWebMessageToSlack(message) {
      posted.push(message);
    },
    resourceId: "channel:slack:C1:1.1",
  });

  await fixture.sendMessage();

  assert.deepEqual(posted, [
    {
      avatarUrl: "https://example.com/alex.png",
      displayName: "Alex",
      text: "Hello",
    },
  ]);
  assert.equal(fixture.streamedMessages[0].length, 1);
  assert.deepEqual(fixture.streamedMemories, [
    {
      resource: "channel:slack:C1:1.1",
      thread: "30000000-0000-4000-8000-000000000001",
    },
  ]);
});

test("web-only Chat streams its own history without thread memory", async () => {
  const fixture = createStreamFixture("", null);

  await fixture.sendMessage();

  assert.deepEqual(fixture.streamedMemories, [undefined]);
});

test("Chat persists trusted user profile over client sender metadata", async () => {
  const fixture = createStreamFixture("", null);
  const messageCreatedAt = "2026-09-04T05:00:00.000Z";

  await fixture.sendMessage(DEFAULT_CHAT_MODEL_ID, false, {
    createdAt: messageCreatedAt,
    sender: {
      avatarUrl: "https://attacker.example/avatar.png",
      displayName: "Spoofed",
      userId: "spoofed-user",
    },
  });

  assert.deepEqual(fixture.savedMessages[0].metadata, {
    createdAt: messageCreatedAt,
    sender: {
      avatarUrl: context.userAvatarUrl,
      displayName: context.userDisplayName,
      userId: context.userId,
    },
  });
  assert.deepEqual(
    (fixture.streamedMessages[0][0] as ChatMessage).metadata,
    fixture.savedMessages[0].metadata
  );
});

test("edited Chat prompt replaces its turn and removes later messages", async () => {
  const fixture = createStreamFixture("", null, null, null, [
    {
      id: "user-1",
      parts: [{ text: "Original prompt", type: "text" }],
      role: "user",
    },
    {
      id: "assistant-1",
      parts: [{ text: "Original response", type: "text" }],
      role: "assistant",
    },
  ]);

  await fixture.editMessage("user-1", "Edited prompt");

  assert.deepEqual(fixture.deletedMessagePivots, [
    { inclusive: false, messageId: "user-1" },
  ]);
  assert.deepEqual(fixture.streamedMessages, [
    [
      {
        id: "user-1",
        metadata: {
          sender: {
            avatarUrl: context.userAvatarUrl,
            displayName: context.userDisplayName,
            userId: context.userId,
          },
        },
        parts: [{ text: "Edited prompt", type: "text" }],
        role: "user",
      },
    ],
  ]);
});

test("active Chat stream rejects a second producer before side effects", async () => {
  const fixture = createStreamFixture("", null);
  fixture.denyStreamClaim();

  await assert.rejects(fixture.sendMessage(), ChatStreamConflictError);
  assert.deepEqual(fixture.savedMessages, []);
  assert.deepEqual(fixture.streamedMessages, []);
});

test("Chat enables Gateway web search for every response model", async () => {
  const fixture = createStreamFixture("", null);

  for (const { id } of chatModelOptions) {
    await fixture.sendMessage(id, true);
  }
  await fixture.sendMessage(DEFAULT_CHAT_MODEL_ID, false);

  assert.deepEqual(
    fixture.streamedModels,
    [...chatModelOptions, { id: DEFAULT_CHAT_MODEL_ID }].map(
      ({ id }) => `vercel/${id}`
    )
  );
  assert.deepEqual(fixture.streamedActiveTools, [
    ...chatModelOptions.map(() => ["webSearch"]),
    [],
  ]);
});

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
  modelId: DEFAULT_CHAT_MODEL_ID,
  projectId,
  streamId: "8f1f429e-84f3-4a10-9f2c-58a1a7a8f003",
  webSearchEnabled: false,
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
    activeStreamId: null,
    createdAt,
    hasUnreadResponse: false,
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

test("stream authorization starts Chat and membership reads together", async () => {
  let chatReadFinished = false;
  const chatRepository = {
    async createChat() {
      throw new Error("Chat creation should not run.");
    },
    async getChatById() {
      await Promise.resolve();
      chatReadFinished = true;
      return createChat({ projectId });
    },
    async isWorkspaceMember() {
      assert.equal(chatReadFinished, false);
      return true;
    },
  };

  const result = await authorizeAndCreateStreamChat(
    chatRepository,
    createRepositories().projectRepository,
    request,
    context
  );

  assert.equal(result.created, false);
});

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
