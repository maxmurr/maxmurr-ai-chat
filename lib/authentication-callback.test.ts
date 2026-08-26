import assert from "node:assert/strict"
import { test } from "node:test"

import { getSafeAuthenticationCallbackPath } from "@/lib/authentication-callback"

test("authentication callbacks allow local paths and reject open redirects", () => {
  assert.equal(
    getSafeAuthenticationCallbackPath("/accept-invitation/invite-1?from=email"),
    "/accept-invitation/invite-1?from=email"
  )
  assert.equal(
    getSafeAuthenticationCallbackPath("https://attacker.example/path"),
    "/chat"
  )
  assert.equal(
    getSafeAuthenticationCallbackPath("//attacker.example/path"),
    "/chat"
  )
  assert.equal(
    getSafeAuthenticationCallbackPath("/\\attacker.example/path"),
    "/chat"
  )
  assert.equal(getSafeAuthenticationCallbackPath(undefined), "/chat")
})
