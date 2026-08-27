import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AuthenticationFormCard } from "@/components/auth/authentication-form-card"
import {
  auth,
  isEmailOtpAuthenticationEnabled,
  isGoogleAuthenticationEnabled,
} from "@/di/authentication"
import { getSafeAuthenticationCallbackPath } from "@/lib/authentication-callback"

export const metadata: Metadata = {
  title: "Sign Up · AI Chat",
  description: "Create an account with verified email.",
}

/** Redirects active sessions or renders verified email account creation. */
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
      emailOtpEnabled={isEmailOtpAuthenticationEnabled}
      googleEnabled={isGoogleAuthenticationEnabled}
      initialErrorMessage={
        error ? "Could not continue with Google. Try again." : undefined
      }
      mode="sign-up"
    />
  )
}
