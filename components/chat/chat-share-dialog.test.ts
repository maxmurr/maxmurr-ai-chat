import assert from "node:assert/strict"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { buildChatShareLink } from "@/components/chat/chat-share-dialog"
import { ChatShareLinkField } from "@/components/chat/chat-share-link-field"

test("chat share links encode conversation IDs", () => {
  assert.equal(
    buildChatShareLink("billing brief/2026"),
    "https://chat.example.com/share/billing%20brief%2F2026"
  )
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
