import type { CSSProperties, ReactNode } from "react"
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email"

type TransactionalEmailShellProps = {
  action?: {
    label: string
    url: string
  }
  children: ReactNode
  preview: string
  title: string
}

type AuthenticationOtpEmailProps = {
  otp: string
}

type WorkspaceInvitationEmailProps = {
  invitationUrl: string
  inviterName: string
  recipientEmail: string
  workspaceName: string
}

function TransactionalEmailShell({
  action,
  children,
  preview,
  title,
}: TransactionalEmailShellProps) {
  return (
    <Html dir="ltr" lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={brandStyle}>AI Chat</Text>
          <Heading as="h1" style={headingStyle}>
            {title}
          </Heading>
          {children}
          {action && (
            <>
              <Section style={actionStyle}>
                <Button href={action.url} style={buttonStyle}>
                  {action.label}
                </Button>
              </Section>
              <Text style={fallbackStyle}>
                Button not working?{" "}
                <Link href={action.url}>Open this link</Link>.
              </Text>
            </>
          )}
          <Text style={footerStyle}>
            If you were not expecting this email, you can ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

/** React Email message containing Better Auth email one-time password code. */
export function AuthenticationOtpEmail({ otp }: AuthenticationOtpEmailProps) {
  return (
    <TransactionalEmailShell
      preview={`Your AI Chat verification code is ${otp}`}
      title="Your verification code"
    >
      <Text style={paragraphStyle}>
        Enter this code to continue with AI Chat.
      </Text>
      <Text style={codeStyle}>{otp}</Text>
      <Text style={paragraphStyle}>This code expires in 5 minutes.</Text>
    </TransactionalEmailShell>
  )
}

/** React Email message for accepting AI Chat workspace invitations. */
export function WorkspaceInvitationEmail({
  invitationUrl,
  inviterName,
  recipientEmail,
  workspaceName,
}: WorkspaceInvitationEmailProps) {
  return (
    <TransactionalEmailShell
      action={{ label: "Accept invitation", url: invitationUrl }}
      preview={`${inviterName} invited you to join ${workspaceName}`}
      title={`Join ${workspaceName}`}
    >
      <Text style={paragraphStyle}>
        {inviterName} invited you to join {workspaceName} on AI Chat.
      </Text>
      <Text style={paragraphStyle}>
        Sign in or create an account with {recipientEmail} to accept.
      </Text>
    </TransactionalEmailShell>
  )
}

const bodyStyle = {
  backgroundColor: "#f4f4f5",
  color: "#18181b",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: 0,
  padding: "32px 12px",
} satisfies CSSProperties

const containerStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "520px",
  padding: "32px",
} satisfies CSSProperties

const brandStyle = {
  color: "#71717a",
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  margin: "0 0 24px",
  textTransform: "uppercase",
} satisfies CSSProperties

const headingStyle = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: "32px",
  margin: "0 0 16px",
} satisfies CSSProperties

const paragraphStyle = {
  color: "#52525b",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 12px",
} satisfies CSSProperties

const codeStyle = {
  color: "#18181b",
  fontFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
  fontSize: "32px",
  fontVariantNumeric: "tabular-nums",
  fontWeight: 700,
  letterSpacing: "0.18em",
  lineHeight: "40px",
  margin: "24px 0",
} satisfies CSSProperties

const actionStyle = {
  margin: "24px 0",
} satisfies CSSProperties

const buttonStyle = {
  backgroundColor: "#18181b",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  padding: "12px 18px",
  textDecoration: "none",
} satisfies CSSProperties

const fallbackStyle = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 24px",
} satisfies CSSProperties

const footerStyle = {
  borderTop: "1px solid #e4e4e7",
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
  paddingTop: "20px",
} satisfies CSSProperties
