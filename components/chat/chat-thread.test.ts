import assert from "node:assert/strict"
import { test } from "node:test"

import {
  getBillingRecommendationQuestionnaireAnswers,
  isChatFilePickerShortcut,
} from "@/components/chat/chat-thread"

test("chat file picker shortcut accepts Command or Control plus U", () => {
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: false, key: "u", metaKey: true }),
    true
  )
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: true, key: "U", metaKey: false }),
    true
  )
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: false, key: "u", metaKey: false }),
    false
  )
  assert.equal(
    isChatFilePickerShortcut({ ctrlKey: false, key: "k", metaKey: true }),
    false
  )
})

test("billing questionnaire maps every answer variant to labels", () => {
  const formData = new FormData()
  formData.set("priority", "cost")
  formData.append("pricingModels", "usage")
  formData.append("pricingModels", "seat")
  formData.set("timeline", "no-date")
  formData.set("constraints", "Keep existing invoice IDs")

  assert.deepEqual(getBillingRecommendationQuestionnaireAnswers(formData), {
    constraints: "Keep existing invoice IDs",
    pricingModels: ["Usage-based", "Per seat"],
    priority: "Cost at scale",
    timeline: "No fixed date",
  })
})
