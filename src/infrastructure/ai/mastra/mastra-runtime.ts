import { Mastra } from "@mastra/core"
import { InMemoryStore } from "@mastra/core/storage"
import { LangfuseExporter } from "@mastra/langfuse"
import { Observability } from "@mastra/observability"

import { chatAssistantAgent } from "@/src/infrastructure/ai/mastra/chat-assistant-agent"

/** Shared Mastra runtime used by chat infrastructure. */
export const mastraRuntime = new Mastra({
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
  storage: new InMemoryStore({ id: "chat-storage" }),
})
