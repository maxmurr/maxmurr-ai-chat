import { Mastra } from "@mastra/core"
import { InMemoryStore } from "@mastra/core/storage"

import { chatAssistantAgent } from "@/src/infrastructure/ai/mastra/chat-assistant-agent"

/** Shared Mastra runtime used by chat infrastructure. */
export const mastraRuntime = new Mastra({
  agents: { chatAssistantAgent },
  storage: new InMemoryStore({ id: "chat-storage" }),
})
