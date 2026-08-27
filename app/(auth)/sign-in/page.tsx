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
  title: "Sign In · AI Chat",
  description: "Sign in with a one-time email code.",
}

/** Redirects active sessions or renders email one-time password sign-in. */
export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { callbackURL, error } = await searchParams
  const callbackPath = getSafeAuthenticationCallbackPath(callbackURL)
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user.emailVerified) {
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
      mode="sign-in"
    />
  )
}
