import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AuthenticationFormCard } from "@/components/auth/authentication-form-card"
import {
  auth,
  isGoogleAuthenticationEnabled,
} from "@/di/authentication"
import { getSafeAuthenticationCallbackPath } from "@/lib/authentication-callback"

export const metadata: Metadata = {
  title: "Sign Up · AI Chat",
  description: "Create an account.",
}

/** Redirects active sessions or renders account-creation controls. */
export default async function SignUpPage({
  searchParams,
}: PageProps<"/sign-up">) {
  const { callbackURL, error } = await searchParams
  const callbackPath = getSafeAuthenticationCallbackPath(callbackURL)
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    redirect(callbackPath)
  }

  return (
    <AuthenticationFormCard
      callbackPath={callbackPath}
      googleEnabled={isGoogleAuthenticationEnabled}
      initialErrorMessage={
        error ? "Could not continue with Google. Try again." : undefined
      }
      mode="sign-up"
    />
  )
}
