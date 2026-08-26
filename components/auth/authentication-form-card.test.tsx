import assert from "node:assert/strict"
import { test } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

import {
  AuthenticationFormCard,
  validateAuthenticationPasswordConfirmation,
} from "./authentication-form-card"

test("authentication cards render sign-in and sign-up variants", () => {
  const signInMarkup = renderToStaticMarkup(
    <AuthenticationFormCard googleEnabled={false} mode="sign-in" />
  )
  const signUpMarkup = renderToStaticMarkup(
    <AuthenticationFormCard googleEnabled mode="sign-up" />
  )

  assert.match(signInMarkup, /Enter your username and password/)
  assert.doesNotMatch(signInMarkup, /Confirm password/)
  assert.doesNotMatch(signInMarkup, /\/google-logo\.svg/)
  assert.match(signUpMarkup, /type="email"/)
  assert.match(signUpMarkup, /Confirm password/)
  assert.match(signUpMarkup, /\/google-logo\.svg/)
  assert.match(signUpMarkup, /\/google-logo-dark\.svg/)
})

test("sign-up validation rejects mismatched passwords", () => {
  assert.equal(
    validateAuthenticationPasswordConfirmation(
      "correct horse battery staple",
      "different password"
    ),
    "Passwords do not match."
  )
})
