import { redirect } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  isEmailOtpAuthenticationEnabled,
  isGoogleAuthenticationEnabled,
} from "@/di/authentication"
import { AuthenticationFormCard } from "@/features/user/components/authentication-form-card"
import { getCurrentUserSession } from "@/features/user/user-queries"
import { getSafeAuthenticationCallbackPath } from "@/lib/authentication-callback"

/** Redirects active sessions or renders passwordless authentication form. */
export async function AuthenticationPage({
  callbackValue,
  hasOauthError,
  mode,
}: {
  callbackValue?: string
  hasOauthError: boolean
  mode: "sign-in" | "sign-up"
}) {
  const callbackPath = getSafeAuthenticationCallbackPath(callbackValue)
  const { session } = await getCurrentUserSession()

  if (
    (mode === "sign-in" && session?.user.emailVerified) ||
    (mode === "sign-up" && session)
  ) {
    redirect(callbackPath)
  }

  return (
    <AuthenticationFormCard
      callbackPath={callbackPath}
      emailOtpEnabled={isEmailOtpAuthenticationEnabled}
      googleEnabled={isGoogleAuthenticationEnabled}
      initialErrorMessage={
        hasOauthError
          ? "Could not continue with Google. Try again."
          : undefined
      }
      mode={mode}
    />
  )
}

/** Reserves authentication card while session state loads. */
export function AuthenticationPageSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col gap-6 p-6">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </CardContent>
    </Card>
  )
}
