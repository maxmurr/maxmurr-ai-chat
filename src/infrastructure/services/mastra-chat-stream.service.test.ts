import assert from "node:assert/strict";
import { test } from "node:test";

import type { handleChatStream } from "@mastra/ai-sdk";

import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface";
import type { CrashReporterService } from "@/src/application/services/crash-reporter.service.interface";
import type { InstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { LibraryService } from "@/src/application/services/library.service.interface";
import type { ProjectRepository } from "@/src/application/services/project-repository.service.interface";
import type { Chat, ChatMessage } from "@/src/entities/models/chat";
import type { Project } from "@/src/entities/models/project";
import { createMastraChatStreamService } from "@/src/infrastructure/services/mastra-chat-stream.service";

const context = { organizationId: "workspace-1", userId: "user-1" };
const createdAt = new Date("2026-08-30T00:00:00.000Z");

function createStreamFixture(instructions: string, projectId: string | null) {
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
    folderId: null,
    id: "10000000-0000-4000-8000-000000000001",
    instructions,
    name: "Launch",
    organizationId: context.organizationId,
    ownerId: context.userId,
    updatedAt: createdAt,
  };
  let projectReads = 0;
  const savedMessages: ChatMessage[] = [];
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
    async setChatFileProvenance() {},
  } as unknown as LibraryService;
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
    crashReporterService,
    instrumentationService,
    async (options) => {
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
