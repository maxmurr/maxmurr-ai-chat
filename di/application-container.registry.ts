import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface"
import type { StreamChatResponse } from "@/src/application/services/chat-stream.service.interface"
import type { ChatLibraryController } from "@/src/interface-adapters/controllers/chat/chat-library.controller"
import type { StreamChatController } from "@/src/interface-adapters/controllers/chat/stream-chat.controller"

/** Stable Ioctopus tokens for application dependency bindings. */
export const applicationInjectionTokens = {
  chatLibraryController: "ChatLibraryController",
  chatRepository: "ChatRepository",
  streamChatController: "StreamChatController",
  streamChatResponse: "StreamChatResponse",
} as const

/** Type-safe Ioctopus registry for production dependencies. */
export type ApplicationDependencyRegistry = {
  [applicationInjectionTokens.chatLibraryController]: ChatLibraryController
  [applicationInjectionTokens.chatRepository]: ChatRepository
  [applicationInjectionTokens.streamChatController]: StreamChatController
  [applicationInjectionTokens.streamChatResponse]: StreamChatResponse
}
