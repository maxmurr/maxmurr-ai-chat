import assert from "node:assert/strict"
import { test } from "node:test"
import { render } from "react-email"

import {
  AuthenticationVerificationEmail,
  WorkspaceInvitationEmail,
} from "@/src/infrastructure/email/transactional-email-templates"

test("transactional email templates render their action links", async () => {
  const verificationHtml = await render(
    <AuthenticationVerificationEmail
      verificationUrl="https://chat.example.com/verify-email/token"
    />
  )
  const invitationHtml = await render(
    <WorkspaceInvitationEmail
      invitationUrl="https://chat.example.com/accept-invitation/invite-1"
      inviterName="Max"
      recipientEmail="sam@example.com"
      workspaceName="Acme"
    />
  )

  assert.match(verificationHtml, /Verify email/)
  assert.match(
    verificationHtml,
    /https:\/\/chat\.example\.com\/verify-email\/token/
  )
  assert.match(invitationHtml, /Max invited you to join Acme/)
  assert.match(
    invitationHtml,
    /https:\/\/chat\.example\.com\/accept-invitation\/invite-1/
  )
})
