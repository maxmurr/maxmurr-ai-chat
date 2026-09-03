import { after } from "next/server";

import { handleChatAssistantSlackWebhook } from "@/di/mastra-agent-controller";

export const maxDuration = 60;

/** Verifies and dispatches Slack events into Chat Assistant controller sessions. */
export function POST(request: Request) {
  return handleChatAssistantSlackWebhook(request, (promise) =>
    after(() => promise)
  );
}
