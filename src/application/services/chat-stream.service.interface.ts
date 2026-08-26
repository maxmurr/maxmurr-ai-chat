import type { ChatStreamRequest } from "@/src/entities/models/chat-stream-request"

/** Streams one validated conversation through a configured chat provider. */
export type StreamChatResponse = (
  request: ChatStreamRequest,
  abortSignal: AbortSignal
) => Promise<Response>
