import "server-only"

import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins/email-otp"
import { organization } from "better-auth/plugins/organization"
import { username } from "better-auth/plugins/username"
import { after } from "next/server"

import { appDatabase } from "@/drizzle/app-database"
import * as appDatabaseSchema from "@/drizzle/app-schema"
import {
  isResendEmailServiceEnabled,
  sendAuthenticationOtpEmail,
  sendWorkspaceInvitationEmail,
} from "@/src/infrastructure/email/resend-email-service"

const applicationUrl = process.env.BETTER_AUTH_URL
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

/** Reports whether email one-time password delivery has all required configuration. */
export const isEmailOtpAuthenticationEnabled = Boolean(
  applicationUrl && isResendEmailServiceEnabled
)

function createWorkspaceInvitationUrl(invitationId: string) {
  if (!applicationUrl) {
    throw new Error("Workspace invitation URL missing: set BETTER_AUTH_URL")
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

/** Better Auth server for email one-time passwords, OAuth, sessions, and authorization. */
export const auth = betterAuth({
  appName: "AI Chat",
  advanced: isEmailOtpAuthenticationEnabled
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
  user: {
    validateUserInfo: ({ source, user }) => {
      if (
        source.action === "create-user" &&
        source.method === "email-otp" &&
        (typeof user.username !== "string" || !user.username)
      ) {
        return {
          error: "SIGN_UP_REQUIRED",
          errorDescription: "Sign up before using email OTP sign-in.",
        }
      }
    },
  },
  session: {
    disableSessionRefresh: true,
  },
  account: {
    encryptOAuthTokens: true,
  },
  disabledPaths: [
    "/is-username-available",
    "/sign-in/email",
    "/sign-in/username",
    "/sign-up/email",
    ...(isEmailOtpAuthenticationEnabled
      ? []
      : ["/organization/invite-member"]),
  ],
  rateLimit: {
    enabled: true,
    storage: "database",
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
    emailOTP({
      expiresIn: 5 * 60,
      otpLength: 6,
      sendVerificationOTP: async ({ email, otp }) => {
        await sendAuthenticationOtpEmail({
          otp,
          recipientEmail: email,
        })
      },
      storeOTP: "encrypted",
    }),
    organization({
      requireEmailVerificationOnInvitation: true,
      sendInvitationEmail: isEmailOtpAuthenticationEnabled
        ? async ({
            email,
            id,
            invitation,
            inviter,
            organization: workspace,
          }) => {
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
