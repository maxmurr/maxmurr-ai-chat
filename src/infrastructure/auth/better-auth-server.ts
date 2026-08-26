import "server-only"

import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins/organization"
import { username } from "better-auth/plugins/username"

import { appDatabase } from "@/drizzle/app-database"
import * as appDatabaseSchema from "@/drizzle/app-schema"

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

/** Reports whether Google OAuth has both required credentials. */
export const isGoogleAuthenticationEnabled = Boolean(
  googleClientId && googleClientSecret
)

/** Better Auth server for credential, OAuth, session, and authorization APIs. */
export const auth = betterAuth({
  appName: "AI Chat",
  database: drizzleAdapter(appDatabase, {
    provider: "pg",
    schema: appDatabaseSchema,
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
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
    organization(),
    username({
      displayUsername: false,
      immutableUsername: true,
      minUsernameLength: 3,
      maxUsernameLength: 31,
    }),
  ],
})
