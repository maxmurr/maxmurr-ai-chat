import { createAuthClient } from "better-auth/react"
import {
  organizationClient,
  usernameClient,
} from "better-auth/client/plugins"

/** Browser client for Better Auth credential, OAuth, session, and workspace endpoints. */
export const authClient = createAuthClient({
  plugins: [
    organizationClient(),
    usernameClient({ displayUsername: false }),
  ],
})
