import { createModule } from "@evyweb/ioctopus"

import {
  applicationInjectionTokens,
  type ApplicationDependencyRegistry,
} from "@/di/application-container.registry"
import { drizzleChatRepository } from "@/src/infrastructure/repositories/drizzle-chat.repository"
import { createMastraChatStreamService } from "@/src/infrastructure/services/mastra-chat-stream.service"
import { createChatLibraryController } from "@/src/interface-adapters/controllers/chat/chat-library.controller"
import { createStreamChatController } from "@/src/interface-adapters/controllers/chat/stream-chat.controller"

/** Registers chat persistence, controllers, and Mastra streaming adapter. */
export function createChatModule() {
  const chatModule = createModule<ApplicationDependencyRegistry>()

  chatModule
    .bind(applicationInjectionTokens.chatRepository)
    .toValue(drizzleChatRepository)
  chatModule
    .bind(applicationInjectionTokens.streamChatResponse)
    .toHigherOrderFunction(createMastraChatStreamService, [
      applicationInjectionTokens.chatRepository,
      applicationInjectionTokens.libraryController,
      applicationInjectionTokens.crashReporter,
      applicationInjectionTokens.instrumentation,
    ])
  chatModule
    .bind(applicationInjectionTokens.streamChatController)
    .toHigherOrderFunction(createStreamChatController, [
      applicationInjectionTokens.streamChatResponse,
    ])
  chatModule
    .bind(applicationInjectionTokens.chatLibraryController)
    .toFactory((resolve) =>
      createChatLibraryController(
        resolve(applicationInjectionTokens.chatRepository),
        resolve(applicationInjectionTokens.libraryController)
      )
    )

  return chatModule
}
