import assert from "node:assert/strict"
import { test } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

import {
  AuthenticationFormCard,
  maskAuthenticationEmail,
  validateAuthenticationOtp,
} from "./authentication-form-card"

test("authentication cards render email OTP sign-in and sign-up variants", () => {
  const signInMarkup = renderToStaticMarkup(
    <AuthenticationFormCard
      emailOtpEnabled
      googleEnabled={false}
      mode="sign-in"
    />
  )
  const signUpMarkup = renderToStaticMarkup(
    <AuthenticationFormCard emailOtpEnabled googleEnabled mode="sign-up" />
  )

  assert.match(signInMarkup, /Welcome back/)
  assert.match(signInMarkup, /Sign in to your account/)
  assert.match(signInMarkup, /type="email"/)
  assert.match(signInMarkup, /placeholder="m@example.com"/)
  assert.match(signInMarkup, /Send one-time password/)
  assert.doesNotMatch(signInMarkup, /Username/)
  assert.doesNotMatch(signInMarkup, /type="password"/)
  assert.doesNotMatch(signInMarkup, /\/google-logo\.svg/)
  assert.match(signUpMarkup, /Create your account/)
  assert.match(signUpMarkup, /Sign up with a one-time password/)
  assert.match(signUpMarkup, /Username/)
  assert.match(signUpMarkup, /type="email"/)
  assert.doesNotMatch(signUpMarkup, /type="password"/)
  assert.match(signUpMarkup, /\/google-logo\.svg/)
  assert.match(signUpMarkup, /\/google-logo-dark\.svg/)
  assert.ok(
    signUpMarkup.indexOf("Continue with") < signUpMarkup.indexOf("Username")
  )
})

test("authentication card fails closed when email delivery is unavailable", () => {
  const markup = renderToStaticMarkup(
    <AuthenticationFormCard
      emailOtpEnabled={false}
      googleEnabled={false}
      mode="sign-in"
    />
  )

  assert.match(markup, /Email sign-in unavailable/)
  assert.doesNotMatch(markup, /type="email"/)
})

test("email OTP validation requires six digits", () => {
  assert.equal(validateAuthenticationOtp("123456"), undefined)
  assert.equal(validateAuthenticationOtp("12345"), "Enter the 6-digit code.")
  assert.equal(validateAuthenticationOtp("12345a"), "Enter the 6-digit code.")
})

test("authentication email mask keeps only first local-part character", () => {
  assert.equal(maskAuthenticationEmail("max@example.com"), "m***@example.com")
})
