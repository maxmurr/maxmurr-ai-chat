import assert from "node:assert/strict"
import { test } from "node:test"

import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"

test("Ioctopus resolves singleton Chat and Library controllers", () => {
  const chatController = resolveApplicationDependency(
    applicationInjectionTokens.streamChatController
  )
  const libraryController = resolveApplicationDependency(
    applicationInjectionTokens.libraryController
  )

  assert.equal(typeof chatController, "function")
  assert.equal(
    chatController,
    resolveApplicationDependency(applicationInjectionTokens.streamChatController)
  )
  assert.equal(typeof libraryController.uploadFiles, "function")
  assert.equal(
    libraryController,
    resolveApplicationDependency(applicationInjectionTokens.libraryController)
  )
})
