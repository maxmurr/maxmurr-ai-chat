import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AuthenticationFormCard } from "@/components/auth/authentication-form-card"
import {
  auth,
  isGoogleAuthenticationEnabled,
} from "@/di/authentication"

export const metadata: Metadata = {
  title: "Sign Up · AI Chat",
  description: "Create an account.",
}

/** Redirects active sessions or renders account-creation controls. */
export default async function SignUpPage({
  searchParams,
}: PageProps<"/sign-up">) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    redirect("/chat")
  }

  const { error } = await searchParams

  return (
    <AuthenticationFormCard
      googleEnabled={isGoogleAuthenticationEnabled}
      initialErrorMessage={
        error ? "Could not continue with Google. Try again." : undefined
      }
      mode="sign-up"
    />
  )
}
