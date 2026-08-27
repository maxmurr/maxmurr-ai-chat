import assert from "node:assert/strict"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import {
  buildChatShareLink,
  ChatShareDialog,
} from "@/components/chat/chat-share-dialog"
import { ChatShareLinkField } from "@/components/chat/chat-share-link-field"

test("chat share links build without browser globals", () => {
  assert.equal(
    buildChatShareLink(
      "chat 1",
      "workspace",
      null,
      "https://app.example.com"
    ),
    "https://app.example.com/chat/chat%201"
  )
  assert.equal(
    buildChatShareLink(
      "chat-1",
      "public",
      "token/2026",
      "https://app.example.com"
    ),
    "https://app.example.com/share/token%2F2026"
  )
  assert.equal(
    buildChatShareLink(
      "chat-1",
      "public",
      null,
      "https://app.example.com"
    ),
    null
  )
  assert.equal(
    buildChatShareLink(
      "chat-1",
      "private",
      "token",
      "https://app.example.com"
    ),
    null
  )
})

test("chat share dialog server-renders without browser globals", () => {
  assert.doesNotThrow(() =>
    renderToStaticMarkup(
      createElement(ChatShareDialog, {
        chatId: "chat-1",
        initialPublicToken: null,
        initialVisibility: "workspace",
      })
    )
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
