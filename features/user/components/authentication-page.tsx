import { redirect } from "next/navigation"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
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
    <Card
      aria-busy="true"
      aria-label="Loading authentication"
      className="w-full max-w-md [--card-spacing:--spacing(6)]"
    >
      <CardHeader className="justify-items-center gap-2">
        <Skeleton className="h-8 w-2/3 max-w-40" />
        <Skeleton className="h-5 w-4/5 max-w-56 sm:h-4" />
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </CardContent>
      <CardFooter className="justify-center gap-2">
        <Skeleton className="h-5 w-32 max-w-[50%] sm:h-4" />
        <Skeleton className="h-5 w-12 sm:h-4" />
      </CardFooter>
    </Card>
  )
}
