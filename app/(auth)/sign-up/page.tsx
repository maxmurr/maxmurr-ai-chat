import type { Metadata } from "next"
import { Suspense } from "react"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  AuthenticationPage,
  AuthenticationPageSkeleton,
} from "@/features/user/components/authentication-page"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Sign Up · AI Chat",
  description: "Create an account with verified email.",
}

/** Composes sign-up from resolved callback query values. */
export default function SignUpPage({
  searchParams,
}: PageProps<"/sign-up">) {
  return (
    <ErrorBoundary title="Sign up did not load">
      <Suspense fallback={<AuthenticationPageSkeleton />}>
        {searchParams.then(({ callbackURL, error }) => (
          <AuthenticationPage
            callbackValue={
              typeof callbackURL === "string" ? callbackURL : undefined
            }
            hasOauthError={typeof error === "string"}
            mode="sign-up"
          />
        ))}
      </Suspense>
    </ErrorBoundary>
  )
}
