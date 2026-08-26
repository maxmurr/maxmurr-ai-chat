import assert from "node:assert/strict"
import { test } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

import { AuthenticationFormCard } from "./authentication-form-card"

test("authentication cards render sign-in and sign-up variants", () => {
  const signInMarkup = renderToStaticMarkup(
    <AuthenticationFormCard mode="sign-in" />
  )
  const signUpMarkup = renderToStaticMarkup(
    <AuthenticationFormCard mode="sign-up" />
  )

  assert.match(signInMarkup, /Enter your username and password/)
  assert.doesNotMatch(signInMarkup, /Confirm password/)
  assert.match(signUpMarkup, /Confirm password/)
  assert.match(signUpMarkup, /\/google-logo\.svg/)
})
