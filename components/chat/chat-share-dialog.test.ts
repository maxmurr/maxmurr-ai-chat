import assert from "node:assert/strict"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { buildChatShareLink } from "@/components/chat/chat-share-dialog"
import { ChatShareLinkField } from "@/components/chat/chat-share-link-field"

test("chat share links target the viewer route for each visibility", () => {
  const originalWindow = globalThis.window
  // @ts-expect-error minimal browser stub for URL building
  globalThis.window = { location: { origin: "https://app.example.com" } }

  try {
    assert.equal(
      buildChatShareLink("chat 1", "workspace", null),
      "https://app.example.com/chat/chat%201"
    )
    assert.equal(
      buildChatShareLink("chat-1", "public", "token/2026"),
      "https://app.example.com/share/token%2F2026"
    )
    assert.equal(buildChatShareLink("chat-1", "public", null), null)
    assert.equal(buildChatShareLink("chat-1", "private", "token"), null)
  } finally {
    globalThis.window = originalWindow
  }
})

test("chat share link field renders generated link and copy action", () => {
  const shareLink = "https://chat.example.com/share/conversation-1"
  const markup = renderToStaticMarkup(
    createElement(ChatShareLinkField, {
      isGenerating: false,
      shareLink,
    })
  )

  assert.match(markup, new RegExp(shareLink))
  assert.match(markup, /aria-label="Copy link"/)
})
