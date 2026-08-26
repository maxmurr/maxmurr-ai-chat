import assert from "node:assert/strict"
import { test } from "node:test"

import {
  parseOnboardingInviteEmails,
  validateOnboardingInviteEmails,
  validateOnboardingWorkspaceName,
} from "./workspace-onboarding-form"

test("workspace onboarding validates names and normalizes invite emails", () => {
  assert.equal(validateOnboardingWorkspaceName(" "), "Enter a workspace name.")
  assert.equal(validateOnboardingWorkspaceName("Acme Inc."), undefined)
  assert.equal(validateOnboardingInviteEmails(""), undefined)
  assert.equal(
    validateOnboardingInviteEmails("alex@example.com, invalid"),
    "Enter valid email addresses separated by commas."
  )
  assert.deepEqual(
    parseOnboardingInviteEmails(
      " Alex@example.com, jamie@example.com, alex@example.com "
    ),
    ["alex@example.com", "jamie@example.com"]
  )
})
