import "server-only"

import type { ReactNode } from "react"
import { Resend } from "resend"

import {
  AuthenticationOtpEmail,
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
  idempotencyKey?: string
  react: ReactNode
  subject: string
  to: string
}

type AuthenticationOtpEmailInput = {
  otp: string
  recipientEmail: string
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
    idempotencyKey ? { idempotencyKey } : undefined
  )

  if (error) {
    throw new Error(`Resend transactional email failed: ${error.message}`)
  }

  if (!data) {
    throw new Error("Resend transactional email failed: missing response data")
  }
}

/** Sends Better Auth email one-time password codes through Resend. */
export async function sendAuthenticationOtpEmail({
  otp,
  recipientEmail,
}: AuthenticationOtpEmailInput) {
  await sendResendTransactionalEmail({
    react: AuthenticationOtpEmail({ otp }),
    subject: "Your AI Chat verification code",
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
