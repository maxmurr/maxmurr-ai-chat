import assert from "node:assert/strict"
import { test } from "node:test"

import { resolveApplicationDependency } from "@/di/application-container"
import { applicationInjectionTokens } from "@/di/application-container.registry"

test("Ioctopus resolves singleton chat controller", () => {
  const controller = resolveApplicationDependency(
    applicationInjectionTokens.streamChatController
  )

  assert.equal(typeof controller, "function")
  assert.equal(
    controller,
    resolveApplicationDependency(applicationInjectionTokens.streamChatController)
  )
})
