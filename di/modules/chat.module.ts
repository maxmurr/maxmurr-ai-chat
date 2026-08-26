import { createModule } from "@evyweb/ioctopus"

import {
  applicationInjectionTokens,
  type ApplicationDependencyRegistry,
} from "@/di/application-container.registry"
import { streamChatResponseWithMastra } from "@/src/infrastructure/services/mastra-chat-stream.service"
import { createStreamChatController } from "@/src/interface-adapters/controllers/chat/stream-chat.controller"

/** Registers chat controller and Mastra streaming adapter. */
export function createChatModule() {
  const chatModule = createModule<ApplicationDependencyRegistry>()

  chatModule
    .bind(applicationInjectionTokens.streamChatResponse)
    .toFunction(streamChatResponseWithMastra)
  chatModule
    .bind(applicationInjectionTokens.streamChatController)
    .toHigherOrderFunction(createStreamChatController, [
      applicationInjectionTokens.streamChatResponse,
    ])

  return chatModule
}
