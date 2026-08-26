import { Mastra } from "@mastra/core"
import { InMemoryStore } from "@mastra/core/storage"

import { chatAssistantAgent } from "@/mastra/agents/chat-assistant-agent"

/** Shared Mastra runtime used by server-side application routes. */
export const mastra = new Mastra({
  agents: { chatAssistantAgent },
  storage: new InMemoryStore({ id: "chat-storage" }),
})
