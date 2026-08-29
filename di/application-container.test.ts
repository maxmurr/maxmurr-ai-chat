import assert from "node:assert/strict"
import { test } from "node:test"

import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"

test("Ioctopus resolves singleton application dependencies", () => {
  const chatController = resolveApplicationDependency(
    applicationInjectionTokens.streamChatController
  )
  const crashReporter = resolveApplicationDependency(
    applicationInjectionTokens.crashReporter
  )
  const instrumentation = resolveApplicationDependency(
    applicationInjectionTokens.instrumentation
  )
  const libraryController = resolveApplicationDependency(
    applicationInjectionTokens.libraryController
  )

  assert.equal(typeof chatController, "function")
  assert.equal(typeof crashReporter.report, "function")
  assert.equal(typeof instrumentation.startSpan, "function")
  assert.equal(
    instrumentation.startSpan({ name: "test span" }, () => 42),
    42
  )
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
