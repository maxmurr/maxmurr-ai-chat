import "server-only"

import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins/organization"
import { username } from "better-auth/plugins/username"
import { after } from "next/server"

import { appDatabase } from "@/drizzle/app-database"
import * as appDatabaseSchema from "@/drizzle/app-schema"
import {
  isResendEmailServiceEnabled,
  sendAuthenticationVerificationEmail,
  sendWorkspaceInvitationEmail,
} from "@/src/infrastructure/email/resend-email-service"

const applicationUrl = process.env.BETTER_AUTH_URL
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const isTransactionalEmailEnabled = Boolean(
  applicationUrl && isResendEmailServiceEnabled
)

function createWorkspaceInvitationUrl(invitationId: string) {
  if (!applicationUrl) {
    throw new Error(
      "Workspace invitation URL missing: set BETTER_AUTH_URL"
    )
  }

  return new URL(
    `/accept-invitation/${encodeURIComponent(invitationId)}`,
    applicationUrl
  ).toString()
}

/** Reports whether Google OAuth has both required credentials. */
export const isGoogleAuthenticationEnabled = Boolean(
  googleClientId && googleClientSecret
)

/** Better Auth server for credential, OAuth, session, and authorization APIs. */
export const auth = betterAuth({
  appName: "AI Chat",
  advanced: isTransactionalEmailEnabled
    ? {
        backgroundTasks: {
          handler: (promise) => after(() => promise),
        },
      }
    : undefined,
  database: drizzleAdapter(appDatabase, {
    provider: "pg",
    schema: appDatabaseSchema,
    transaction: true,
  }),
  emailVerification: isTransactionalEmailEnabled
    ? {
        autoSignInAfterVerification: true,
        expiresIn: 60 * 60,
        sendOnSignIn: true,
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url, token }) => {
          await sendAuthenticationVerificationEmail({
            recipientEmail: user.email,
            verificationToken: token,
            verificationUrl: url,
          })
        },
      }
    : undefined,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: isTransactionalEmailEnabled,
  },
  session: {
    disableSessionRefresh: true,
  },
  account: {
    encryptOAuthTokens: true,
  },
  disabledPaths: ["/is-username-available"],
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/username": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
  plugins: [
    organization({
      requireEmailVerificationOnInvitation: isTransactionalEmailEnabled,
      sendInvitationEmail: isTransactionalEmailEnabled
        ? async ({ email, id, invitation, inviter, organization: workspace }) => {
            await sendWorkspaceInvitationEmail({
              invitationExpiresAt: invitation.expiresAt,
              invitationId: id,
              invitationUrl: createWorkspaceInvitationUrl(id),
              inviterName: inviter.user.name,
              recipientEmail: email,
              workspaceName: workspace.name,
            })
          }
        : undefined,
    }),
    username({
      displayUsername: false,
      immutableUsername: true,
      minUsernameLength: 3,
      maxUsernameLength: 31,
    }),
  ],
})
