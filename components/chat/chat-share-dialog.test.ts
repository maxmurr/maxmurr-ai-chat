import assert from "node:assert/strict"
import { test } from "node:test"

import { buildChatShareLink } from "@/components/chat/chat-share-dialog"

test("chat share links encode conversation IDs", () => {
  assert.equal(
    buildChatShareLink("billing brief/2026"),
    "https://chat.example.com/share/billing%20brief%2F2026"
  )
})
