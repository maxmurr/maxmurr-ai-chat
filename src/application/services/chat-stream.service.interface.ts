import type {
  ChatRequestContext,
  ChatStreamRequest,
} from "@/src/entities/models/chat-stream-request";

/** Streams one validated chat turn through a configured chat provider. */
export type StreamChatResponse = (
  request: ChatStreamRequest,
  context: ChatRequestContext
) => Promise<Response>;
