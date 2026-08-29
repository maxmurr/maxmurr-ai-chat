import type { Metadata } from "next"
import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  AuthenticationPage,
  AuthenticationPageSkeleton,
} from "@/features/user/components/authentication-page"

export const metadata: Metadata = {
  title: "Sign In · AI Chat",
  description: "Sign in with a one-time email code.",
}

/** Composes sign-in from resolved callback query values. */
export default function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  return (
    <ErrorBoundary title="Sign in did not load">
      <Suspense fallback={<AuthenticationPageSkeleton />}>
        {searchParams.then(({ callbackURL, error }) => (
          <AuthenticationPage
            callbackValue={
              typeof callbackURL === "string" ? callbackURL : undefined
            }
            hasOauthError={typeof error === "string"}
            mode="sign-in"
          />
        ))}
      </Suspense>
    </ErrorBoundary>
  )
}
