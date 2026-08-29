"use server"

import { APIError } from "better-auth/api"
import { headers } from "next/headers"
import { z } from "zod"

import { auth, isEmailOtpAuthenticationEnabled } from "@/di/authentication"
import {
  validateAuthenticationEmail,
  validateAuthenticationOtp,
  validateAuthenticationUsername,
} from "@/features/user/user-authentication-validation"
import { getSafeAuthenticationCallbackPath } from "@/lib/authentication-callback"
import { reportUnexpectedBetterAuthError } from "@/lib/better-auth-error-reporting"
import { traceServerAction } from "@/lib/server-action-tracing"

const authenticationModeSchema = z.enum(["sign-in", "sign-up"])
const emailOtpSignInSchema = z.object({
  email: z.string().max(320),
  mode: authenticationModeSchema,
  otp: z.string().max(6),
  username: z.string().max(31),
})

/** Sends sign-in email one-time password after server validation. */
export async function sendUserAuthenticationCodeAction(email: unknown) {
  return traceServerAction("sendUserAuthenticationCodeAction", async () => {
    if (
      !isEmailOtpAuthenticationEnabled ||
      typeof email !== "string" ||
      validateAuthenticationEmail(email)
    ) {
      return {
        error: "Could not send a one-time password. Try again.",
        ok: false as const,
      }
    }

    try {
      await auth.api.sendVerificationOTP({
        body: { email: email.trim(), type: "sign-in" },
      })
      return { ok: true as const }
    } catch (error) {
      reportUnexpectedBetterAuthError(error)
      return {
        error: "Authentication is unavailable. Try again.",
        ok: false as const,
      }
    }
  })
}

/** Signs user in with validated Better Auth email one-time password. */
export async function signInUserWithEmailOtpAction(input: unknown) {
  return traceServerAction("signInUserWithEmailOtpAction", async () => {
    const parsed = emailOtpSignInSchema.safeParse(input)

    if (!parsed.success) {
      return { code: "INVALID_INPUT" as const, ok: false as const }
    }

    const email = parsed.data.email.trim()
    const username = parsed.data.username.trim()

    if (
      validateAuthenticationEmail(email) ||
      validateAuthenticationOtp(parsed.data.otp) ||
      (parsed.data.mode === "sign-up" &&
        validateAuthenticationUsername(username))
    ) {
      return { code: "INVALID_INPUT" as const, ok: false as const }
    }

    try {
      await auth.api.signInEmailOTP({
        body: {
          email,
          name: parsed.data.mode === "sign-up" ? username : undefined,
          otp: parsed.data.otp,
          ...(parsed.data.mode === "sign-up" ? { username } : {}),
        },
      })
      return { ok: true as const }
    } catch (error) {
      const code = error instanceof APIError ? error.body?.code : undefined

      if (code === "SIGN_UP_REQUIRED") {
        return { code: "SIGN_UP_REQUIRED" as const, ok: false as const }
      }

      if (code === "USERNAME_IS_ALREADY_TAKEN") {
        return {
          code: "USERNAME_IS_ALREADY_TAKEN" as const,
          ok: false as const,
        }
      }

      reportUnexpectedBetterAuthError(error)
      return { code: "INVALID_OTP" as const, ok: false as const }
    }
  })
}

/** Starts Google sign-in and returns provider redirect URL. */
export async function startGoogleAuthenticationAction(
  callbackValue: unknown,
  mode: unknown
) {
  return traceServerAction("startGoogleAuthenticationAction", async () => {
    const parsedMode = authenticationModeSchema.safeParse(mode)

    if (!parsedMode.success) {
      return {
        error: "Could not continue with Google. Try again.",
        ok: false as const,
      }
    }

    const callbackPath = getSafeAuthenticationCallbackPath(callbackValue)
    const errorCallbackPath = new URL(
      parsedMode.data === "sign-up" ? "/sign-up" : "/sign-in",
      "https://callback.invalid"
    )

    errorCallbackPath.searchParams.set("error", "oauth")
    if (callbackPath !== "/chat") {
      errorCallbackPath.searchParams.set("callbackURL", callbackPath)
    }

    try {
      const result = await auth.api.signInSocial({
        body: {
          callbackURL: callbackPath,
          errorCallbackURL: `${errorCallbackPath.pathname}${errorCallbackPath.search}`,
          provider: "google",
        },
      })

      return result.url
        ? { ok: true as const, url: result.url }
        : {
            error: "Could not continue with Google. Try again.",
            ok: false as const,
          }
    } catch (error) {
      reportUnexpectedBetterAuthError(error)
      return {
        error: "Could not continue with Google. Try again.",
        ok: false as const,
      }
    }
  })
}

/** Signs current user out through Better Auth. */
export async function signOutUserAction() {
  return traceServerAction("signOutUserAction", async () => {
    try {
      await auth.api.signOut({ headers: await headers() })
      return { ok: true as const }
    } catch (error) {
      reportUnexpectedBetterAuthError(error)
      return { error: "Could not sign out.", ok: false as const }
    }
  })
}
