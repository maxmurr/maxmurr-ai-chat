import { createAuthClient } from "better-auth/react"
import {
  emailOTPClient,
  organizationClient,
  usernameClient,
} from "better-auth/client/plugins"

/** Browser client for Better Auth email OTP, OAuth, session, and workspace endpoints. */
export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    organizationClient(),
    usernameClient({ displayUsername: false }),
  ],
})
