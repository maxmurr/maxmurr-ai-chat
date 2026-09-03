import "server-only";

import { CHAT_ASSISTANT_CONTROLLER_ID } from "@/src/infrastructure/ai/mastra/chat-assistant-controller";
import { mastraRuntime } from "@/src/infrastructure/ai/mastra/mastra-runtime";

/** Verifies and dispatches Slack webhook through registered Chat Assistant controller. */
export async function handleChatAssistantSlackWebhook(
  request: Request,
  waitUntil: (promise: Promise<unknown>) => void
) {
  const channels = mastraRuntime
    .getAgentController(CHAT_ASSISTANT_CONTROLLER_ID)
    ?.getChannels();

  if (!channels) {
    return Response.json(
      { error: "Slack channel is not configured." },
      { status: 503 }
    );
  }

  return channels.handleWebhookEvent("slack", request, { waitUntil });
}
