import { Agent } from "@mastra/core/agent"

/** Answers chat requests through Mastra using Vercel AI Gateway. */
export const chatAssistantAgent = new Agent({
  id: "chat-assistant",
  name: "Chat Assistant",
  instructions: [
    "Answer the user's request directly and accurately.",
    "Use concise Markdown when structure helps.",
    "State uncertainty instead of inventing facts, sources, or completed actions.",
  ],
  model: "openai/gpt-5.6-luna",
})
