import "server-only"

import { createHash } from "node:crypto"
import type { ReactNode } from "react"
import { Resend } from "resend"

import {
  AuthenticationVerificationEmail,
  WorkspaceInvitationEmail,
} from "@/src/infrastructure/email/transactional-email-templates"

const resendApiKey = process.env.RESEND_API_KEY
const resendEmailFrom = process.env.RESEND_EMAIL_FROM
const resendClient = resendApiKey ? new Resend(resendApiKey) : null

/** Reports whether Resend has API-key and verified-sender configuration. */
export const isResendEmailServiceEnabled = Boolean(
  resendClient && resendEmailFrom
)

type ResendTransactionalEmailInput = {
  idempotencyKey: string
  react: ReactNode
  subject: string
  to: string
}

type AuthenticationVerificationEmailInput = {
  recipientEmail: string
  verificationToken: string
  verificationUrl: string
}

type WorkspaceInvitationEmailInput = {
  invitationExpiresAt: Date
  invitationId: string
  invitationUrl: string
  inviterName: string
  recipientEmail: string
  workspaceName: string
}

async function sendResendTransactionalEmail({
  idempotencyKey,
  react,
  subject,
  to,
}: ResendTransactionalEmailInput) {
  if (!resendClient || !resendEmailFrom) {
    throw new Error(
      "Resend email configuration missing: set RESEND_API_KEY and RESEND_EMAIL_FROM"
    )
  }

  const { data, error } = await resendClient.emails.send(
    {
      from: resendEmailFrom,
      react,
      subject,
      to,
    },
    { idempotencyKey }
  )

  if (error) {
    throw new Error(`Resend transactional email failed: ${error.message}`)
  }

  if (!data) {
    throw new Error("Resend transactional email failed: missing response data")
  }
}

/** Sends Better Auth email verification through Resend. */
export async function sendAuthenticationVerificationEmail({
  recipientEmail,
  verificationToken,
  verificationUrl,
}: AuthenticationVerificationEmailInput) {
  const tokenHash = createHash("sha256")
    .update(verificationToken)
    .digest("hex")

  await sendResendTransactionalEmail({
    idempotencyKey: `email-verification/${tokenHash}`,
    react: AuthenticationVerificationEmail({ verificationUrl }),
    subject: "Verify your email address",
    to: recipientEmail,
  })
}

/** Sends Better Auth workspace invitations through Resend. */
export async function sendWorkspaceInvitationEmail({
  invitationExpiresAt,
  invitationId,
  invitationUrl,
  inviterName,
  recipientEmail,
  workspaceName,
}: WorkspaceInvitationEmailInput) {
  await sendResendTransactionalEmail({
    idempotencyKey: `workspace-invitation/${invitationId}/${invitationExpiresAt.getTime()}`,
    react: WorkspaceInvitationEmail({
      invitationUrl,
      inviterName,
      recipientEmail,
      workspaceName,
    }),
    subject: `Invitation to join ${workspaceName}`,
    to: recipientEmail,
  })
}
