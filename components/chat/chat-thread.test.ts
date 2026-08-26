import assert from "node:assert/strict"
import { test } from "node:test"

import {
  getChatGreeting,
  isChatFilePickerShortcut,
} from "@/components/chat/chat-thread"

test("chat file picker shortcut accepts Command or Control plus U", () => {
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: false, key: "u", metaKey: true }),
    true
  )
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: true, key: "U", metaKey: false }),
    true
  )
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: false, key: "u", metaKey: false }),
    false
  )
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: false, key: "k", metaKey: true }),
    false
  )
})

test("chat greeting follows local time of day", () => {
  assert.equal(getChatGreeting(11), "Good morning")
  assert.equal(getChatGreeting(12), "Good afternoon")
  assert.equal(getChatGreeting(16), "Good afternoon")
  assert.equal(getChatGreeting(17), "Good evening")
})
