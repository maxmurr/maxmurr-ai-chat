import "server-only"

import { cache } from "react"
import { headers } from "next/headers"

import { auth } from "@/di/authentication"

/** Reads current user session once per server render request. */
export const getCurrentUserSession = cache(async () => {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  return { requestHeaders, session }
})
