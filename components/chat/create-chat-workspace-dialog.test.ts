import assert from "node:assert/strict"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { SidebarMenu, SidebarProvider } from "@/components/ui/sidebar"

import { ChatWorkspaceSwitcher } from "./chat-workspace-switcher"
import {
  validateChatWorkspaceMemberEmail,
  validateChatWorkspaceMembers,
  validateChatWorkspaceName,
} from "./create-chat-workspace-dialog"

test("chat workspace switcher mounts form integration", () => {
  const markup = renderToStaticMarkup(
    createElement(
      SidebarProvider,
      null,
      createElement(
        SidebarMenu,
        null,
        createElement(ChatWorkspaceSwitcher)
      )
    )
  )

  assert.match(markup, /Acme Inc\./)
})

test("chat workspace validators cover nested member data", () => {
  assert.equal(validateChatWorkspaceName(" "), "Enter a workspace name.")
  assert.equal(validateChatWorkspaceName("Product"), undefined)
  assert.equal(
    validateChatWorkspaceMemberEmail("not-an-email"),
    "Enter a valid email address."
  )
  assert.equal(
    validateChatWorkspaceMembers([
      { id: "one", email: "member@example.com", role: "member" },
      { id: "two", email: "MEMBER@example.com", role: "admin" },
    ]),
    "Each member email must be unique."
  )
})
