import { handleChatStream, smoothStream } from "@mastra/ai-sdk"
import { createUIMessageStreamResponse, type UIMessage } from "ai"

import type { StreamChatResponse } from "@/src/application/services/chat-stream.service.interface"
import { ChatUnavailableError } from "@/src/entities/errors/chat-errors"
import { mastraRuntime } from "@/src/infrastructure/ai/mastra/mastra-runtime"

/** Streams chat through Mastra and adapts output to AI SDK UI protocol. */
export const streamChatResponseWithMastra: StreamChatResponse = async (
  request,
  abortSignal
) => {
  try {
    const stream = await handleChatStream({
      agentId: "chat-assistant",
      experimentalTransform: smoothStream({
        delayInMs: 20,
        chunking: "word",
      }),
      mastra: mastraRuntime,
      onError: (error) => {
        console.error(
          "Chat stream failed.",
          error instanceof Error ? error.message : "Unknown error"
        )
        return "Chat response failed."
      },
      params: {
        ...request,
        messages: request.messages as unknown as UIMessage[],
        abortSignal,
      },
      sendReasoning: true,
      sendSources: true,
      version: "v7",
    })

    return createUIMessageStreamResponse({ stream })
  } catch (error) {
    throw new ChatUnavailableError({ cause: error })
  }
}
