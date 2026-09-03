import { Mastra } from "@mastra/core";
import { LangfuseExporter } from "@mastra/langfuse";
import { Observability } from "@mastra/observability";
import { PostgresStore } from "@mastra/pg";
import { RedisStreamsPubSub } from "@mastra/redis-streams";

import { chatAssistantAgent } from "@/src/infrastructure/ai/mastra/chat-assistant-agent";
import { chatAssistantController } from "@/src/infrastructure/ai/mastra/chat-assistant-controller";

const postgresUrl = process.env.POSTGRES_URL;
const redisUrl = process.env.REDIS_URL;

if (!postgresUrl) {
  throw new Error(
    "Mastra storage configuration error: POSTGRES_URL is not set"
  );
}

if (!redisUrl) {
  throw new Error("Mastra pub/sub configuration error: REDIS_URL is not set");
}

const mastraRuntimeGlobal = globalThis as typeof globalThis & {
  maxmurrAiChatMastraPubSub?: RedisStreamsPubSub;
  maxmurrAiChatMastraStorage?: PostgresStore;
};
const mastraStorage = (mastraRuntimeGlobal.maxmurrAiChatMastraStorage ??=
  new PostgresStore({
    connectionString: postgresUrl,
    id: "maxmurr-ai-chat-mastra-storage",
    schemaName: "mastra",
  }));
const mastraPubSub = (mastraRuntimeGlobal.maxmurrAiChatMastraPubSub ??=
  new RedisStreamsPubSub({
    keyPrefix: "maxmurr-ai-chat:mastra",
    url: redisUrl,
  }));

/** Shared Mastra runtime used by web Chat and Agent Controller channels. */
export const mastraRuntime = new Mastra({
  agentControllers: {
    [chatAssistantController.id]: chatAssistantController,
  },
  agents: { chatAssistantAgent },
  observability: new Observability({
    configs: {
      langfuse: {
        serviceName: "maxmurr-ai-chat",
        exporters: [
          new LangfuseExporter({
            environment: process.env.NODE_ENV,
            realtime: process.env.NODE_ENV === "development",
          }),
        ],
      },
    },
  }),
  pubsub: mastraPubSub,
  storage: mastraStorage,
});

/** Resolves the Slack-linked Mastra thread for a Chat so web turns share its history and reply into Slack. */
export async function findSlackLinkedThread(chatId: string) {
  const controller = mastraRuntime.getAgentController(
    chatAssistantController.id
  );
  const thread = await controller?.queryThreadById({ threadId: chatId });
  const externalThreadId = thread?.metadata?.channel_externalThreadId;

  if (!controller || !thread || typeof externalThreadId !== "string") {
    return null;
  }

  // Attaches channel output processors to the agent before any Slack message reaches this process.
  await controller.init();

  return {
    async postToSlack(markdown: string) {
      await controller
        .getChannels()
        ?.sdk?.thread(externalThreadId)
        .post({ markdown });
    },
    resourceId: thread.resourceId,
  };
}
