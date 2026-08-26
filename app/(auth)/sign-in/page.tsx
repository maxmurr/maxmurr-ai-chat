import type { Metadata } from "next"

import { AuthenticationFormCard } from "@/components/auth/authentication-form-card"

export const metadata: Metadata = {
  title: "Sign In · AI Chat",
  description: "Sign in to your account.",
}

/** Renders username and password sign-in page. */
export default function SignInPage() {
  return <AuthenticationFormCard mode="sign-in" />
}
