import type { ChatRepository } from "@/src/application/services/chat-repository.service.interface"
import type { StreamChatResponse } from "@/src/application/services/chat-stream.service.interface"
import type { CrashReporterService } from "@/src/application/services/crash-reporter.service.interface"
import type { InstrumentationService } from "@/src/application/services/instrumentation.service.interface"
import type { LibraryRepository } from "@/src/application/services/library-repository.service.interface"
import type { LibraryService } from "@/src/application/services/library.service.interface"
import type { ChatLibraryController } from "@/src/interface-adapters/controllers/chat/chat-library.controller"
import type { StreamChatController } from "@/src/interface-adapters/controllers/chat/stream-chat.controller"

/** Stable Ioctopus tokens for application dependency bindings. */
export const applicationInjectionTokens = {
  chatLibraryController: "ChatLibraryController",
  chatRepository: "ChatRepository",
  crashReporter: "CrashReporterService",
  instrumentation: "InstrumentationService",
  libraryController: "LibraryController",
  libraryRepository: "LibraryRepository",
  streamChatController: "StreamChatController",
  streamChatResponse: "StreamChatResponse",
} as const

/** Type-safe Ioctopus registry for production dependencies. */
export type ApplicationDependencyRegistry = {
  [applicationInjectionTokens.chatLibraryController]: ChatLibraryController
  [applicationInjectionTokens.chatRepository]: ChatRepository
  [applicationInjectionTokens.crashReporter]: CrashReporterService
  [applicationInjectionTokens.instrumentation]: InstrumentationService
  [applicationInjectionTokens.libraryController]: LibraryService
  [applicationInjectionTokens.libraryRepository]: LibraryRepository
  [applicationInjectionTokens.streamChatController]: StreamChatController
  [applicationInjectionTokens.streamChatResponse]: StreamChatResponse
}
