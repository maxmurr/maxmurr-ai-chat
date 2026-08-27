import assert from "node:assert/strict"
import { test } from "node:test"
import { render } from "react-email"

import {
  AuthenticationOtpEmail,
  WorkspaceInvitationEmail,
} from "@/src/infrastructure/email/transactional-email-templates"

test("transactional email templates render authentication codes and invitation links", async () => {
  const authenticationOtpHtml = await render(
    <AuthenticationOtpEmail otp="123456" />
  )
  const invitationHtml = await render(
    <WorkspaceInvitationEmail
      invitationUrl="https://chat.example.com/accept-invitation/invite-1"
      inviterName="Max"
      recipientEmail="sam@example.com"
      workspaceName="Acme"
    />
  )

  assert.match(authenticationOtpHtml, /123456/)
  assert.match(authenticationOtpHtml, /expires in 5 minutes/i)
  assert.doesNotMatch(authenticationOtpHtml, /href=/)
  assert.match(invitationHtml, /Max invited you to join Acme/)
  assert.match(
    invitationHtml,
    /https:\/\/chat\.example\.com\/accept-invitation\/invite-1/
  )
})
