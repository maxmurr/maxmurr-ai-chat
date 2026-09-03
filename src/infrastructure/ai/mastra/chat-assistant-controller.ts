import { createSlackAdapter } from "@chat-adapter/slack";
import { AgentController } from "@mastra/core/agent-controller";

import { DEFAULT_CHAT_MODEL_ID } from "@/src/entities/models/chat-model";
import { chatAssistantAgent } from "@/src/infrastructure/ai/mastra/chat-assistant-agent";
import { createSlackChatLink } from "@/src/infrastructure/ai/mastra/slack-chat-link";
import { drizzleChatRepository } from "@/src/infrastructure/repositories/drizzle-chat.repository";

/** Stable Agent Controller ID used by Mastra routes and registration. */
export const CHAT_ASSISTANT_CONTROLLER_ID = "chat-assistant-controller";

const slackBotToken = process.env.SLACK_BOT_TOKEN;
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackChatLink = createSlackChatLink(drizzleChatRepository);
const slackChannels =
  slackBotToken && slackSigningSecret
    ? {
        adapters: {
          slack: createSlackAdapter({
            botToken: slackBotToken,
            signingSecret: slackSigningSecret,
          }),
        },
        handlers: {
          onDirectMessage: slackChatLink.handleMessage,
          onMention: slackChatLink.handleMessage,
          onSubscribedMessage: slackChatLink.handleMessage,
        },
        onSessionStart: slackChatLink.onSessionStart,
        resolveThreadId: slackChatLink.resolveThreadId,
      }
    : undefined;

/** Hosts Chat Assistant sessions for external chat channels. */
export const chatAssistantController = new AgentController({
  agent: chatAssistantAgent,
  channels: slackChannels,
  disableBuiltinTools: [
    "ask_user",
    "submit_plan",
    "task_write",
    "task_update",
    "task_complete",
    "task_check",
    "subagent",
  ],
  id: CHAT_ASSISTANT_CONTROLLER_ID,
  modes: [
    {
      defaultModelId: `vercel/${DEFAULT_CHAT_MODEL_ID}`,
      id: "chat",
      metadata: { default: true },
      name: "Chat",
    },
  ],
});
