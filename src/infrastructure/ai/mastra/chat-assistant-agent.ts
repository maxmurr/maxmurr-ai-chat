import { Agent } from "@mastra/core/agent";
import { RequestContext } from "@mastra/core/request-context";
import { Memory } from "@mastra/memory";
import { gateway } from "ai";

import {
  DEFAULT_CHAT_MODEL_ID,
  type ChatModelId,
} from "@/src/entities/models/chat-model";

const CHAT_ASSISTANT_MODEL_CONTEXT_KEY = "chat-assistant-model";
type ChatAssistantModel = `vercel/${ChatModelId}`;
type ChatAssistantRequestContext = {
  [CHAT_ASSISTANT_MODEL_CONTEXT_KEY]: ChatAssistantModel;
};
const DEFAULT_CHAT_ASSISTANT_MODEL = `vercel/${DEFAULT_CHAT_MODEL_ID}` as const;

/** Builds request context selecting approved Chat response model. */
export function createChatAssistantRequestContext(modelId: ChatModelId) {
  const requestContext = new RequestContext<ChatAssistantRequestContext>();
  requestContext.set(CHAT_ASSISTANT_MODEL_CONTEXT_KEY, `vercel/${modelId}`);
  return requestContext;
}

/** Answers chat requests through Mastra using Vercel AI Gateway. */
export const chatAssistantAgent = new Agent({
  id: "chat-assistant",
  name: "Chat Assistant",
  instructions: [
    "Answer the user's request directly and accurately.",
    "Use concise Markdown when structure helps.",
    "State uncertainty instead of inventing facts, sources, or completed actions.",
    "Use web search when current or source-grounded information would improve the answer.",
  ],
  // Slack-linked Chats use one resource per thread; web-only Chats stay stateless in Mastra.
  memory: new Memory({
    options: {
      generateTitle: false,
      lastMessages: 40,
      observationalMemory: {
        model: "vercel/google/gemini-2.5-flash",
        scope: "resource",
      },
    },
  }),
  model: ({ requestContext }) =>
    requestContext.get(CHAT_ASSISTANT_MODEL_CONTEXT_KEY) ??
    DEFAULT_CHAT_ASSISTANT_MODEL,
  tools: { webSearch: gateway.tools.exaSearch() },
});
