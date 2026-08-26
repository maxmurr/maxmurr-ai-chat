import type { StreamChatResponse } from "@/src/application/services/chat-stream.service.interface"
import type { StreamChatController } from "@/src/interface-adapters/controllers/chat/stream-chat.controller"

/** Stable Ioctopus tokens for application dependency bindings. */
export const applicationInjectionTokens = {
  streamChatController: "StreamChatController",
  streamChatResponse: "StreamChatResponse",
} as const

/** Type-safe Ioctopus registry for production dependencies. */
export type ApplicationDependencyRegistry = {
  [applicationInjectionTokens.streamChatController]: StreamChatController
  [applicationInjectionTokens.streamChatResponse]: StreamChatResponse
}
