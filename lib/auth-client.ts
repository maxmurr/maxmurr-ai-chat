import { createAuthClient } from "better-auth/react"
import { usernameClient } from "better-auth/client/plugins"

/** Browser client for Better Auth credential, OAuth, and session endpoints. */
export const authClient = createAuthClient({
  plugins: [usernameClient({ displayUsername: false })],
})
