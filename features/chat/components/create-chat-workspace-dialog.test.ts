import assert from "node:assert/strict"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { SidebarMenu, SidebarProvider } from "@/components/ui/sidebar"

import { ChatWorkspaceSwitcher } from "./chat-workspace-switcher"
import { inviteWorkspaceMembers } from "@/features/workspace/workspace-invitations"
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
        createElement(ChatWorkspaceSwitcher, {
          activeWorkspaceId: "workspace-1",
          workspaces: [{ id: "workspace-1", name: "Acme Inc." }],
        })
      )
    )
  )

  assert.match(markup, /Acme Inc\./)
  assert.match(markup, /rounded-md[^>]*>A<\/span>/)
  assert.doesNotMatch(markup, /lucide-briefcase-business/)
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

test("chat workspace invitations preserve roles and report each failure", async () => {
  const sentInvitations: Array<{
    email: string
    organizationId: string
    role: "admin" | "member"
  }> = []
  const reportedErrors: unknown[] = []
  const failedEmails = await inviteWorkspaceMembers(
    "workspace-1",
    [
      { email: " Admin@Example.com ", role: "admin" },
      { email: "api-error@example.com", role: "member" },
      { email: "network-error@example.com", role: "member" },
    ],
    async (invitation) => {
      sentInvitations.push(invitation)

      if (invitation.email === "api-error@example.com") {
        throw new Error("Invitation rejected")
      }

      if (invitation.email === "network-error@example.com") {
        throw new Error("Network unavailable")
      }

      return undefined
    },
    (error) => reportedErrors.push(error)
  )

  assert.deepEqual(reportedErrors, [
    new Error("Invitation rejected"),
    new Error("Network unavailable"),
  ])
  assert.deepEqual(sentInvitations, [
    {
      email: "admin@example.com",
      organizationId: "workspace-1",
      role: "admin",
    },
    {
      email: "api-error@example.com",
      organizationId: "workspace-1",
      role: "member",
    },
    {
      email: "network-error@example.com",
      organizationId: "workspace-1",
      role: "member",
    },
  ])
  assert.deepEqual(failedEmails, [
    "api-error@example.com",
    "network-error@example.com",
  ])
})
