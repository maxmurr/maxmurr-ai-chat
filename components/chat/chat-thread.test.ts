import assert from "node:assert/strict"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import {
  ChatComposer,
  isChatFilePickerShortcut,
  validateChatComposerMessage,
} from "@/components/chat/chat-composer"
import { getChatGreeting } from "@/components/chat/chat-message-list"

test("chat composer mounts TanStack form integration", () => {
  const markup = renderToStaticMarkup(
    createElement(ChatComposer, {
      attachments: [],
      draft: "",
      isGenerating: false,
      onAnnouncementChange() {},
      onAttachmentsChange() {},
      onDraftChange() {},
      async onSendMessage() {},
      onStopResponse() {},
    })
  )

  assert.match(markup, /aria-label="Message"/)
})

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

test("chat composer requires text or an attachment", () => {
  assert.equal(
    validateChatComposerMessage("  ", []),
    "Enter a message or attach a file."
  )
  assert.equal(validateChatComposerMessage("Hello", []), undefined)
})

test("chat greeting follows local time of day", () => {
  assert.equal(getChatGreeting(11), "Good morning")
  assert.equal(getChatGreeting(12), "Good afternoon")
  assert.equal(getChatGreeting(16), "Good afternoon")
  assert.equal(getChatGreeting(17), "Good evening")
})
