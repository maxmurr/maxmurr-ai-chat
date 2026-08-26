import type { Metadata } from "next"

import { AuthenticationFormCard } from "@/components/auth/authentication-form-card"

export const metadata: Metadata = {
  title: "Sign Up · AI Chat",
  description: "Create an account.",
}

/** Renders username and password account-creation page. */
export default function SignUpPage() {
  return <AuthenticationFormCard mode="sign-up" />
}
