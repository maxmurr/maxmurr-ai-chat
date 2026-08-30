import type { Metadata } from "next";
import { Suspense } from "react";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  AuthenticationPage,
  AuthenticationPageSkeleton,
} from "@/features/user/components/authentication-page";

export const metadata: Metadata = {
  title: "Sign Up · AI Chat",
  description: "Create an account with verified email.",
};

/** Composes sign-up from resolved callback query values. */
export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <div data-testid="sign-up-shell">
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
    </div>
  );
}
