import assert from "node:assert/strict"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { ChatPageShell } from "@/components/chat/chat-page-shell"
import {
  getBillingRecommendationQuestionnaireAnswers,
  isChatFilePickerShortcut,
} from "@/components/chat/chat-thread"

function renderBillingRecommendationPage() {
  return renderToStaticMarkup(
    createElement(ChatPageShell, {
      activeConversation: {
        id: "51dfd3da-c28d-4fd7-9d2d-3441744a2ae3",
        title: "Billing: build or buy",
      },
    })
  )
}

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

test("billing questionnaire uses standard reasoning presentation", () => {
  const markup = renderBillingRecommendationPage()
  const reasoningStart = markup.indexOf(">Reasoning<")

  assert.notEqual(reasoningStart, -1)

  const reasoningEnd = markup.indexOf('data-slot="bubble"', reasoningStart)

  assert.notEqual(reasoningEnd, -1)

  const reasoningMarkup = markup.slice(reasoningStart, reasoningEnd + 200)

  assert.match(reasoningMarkup, /data-open=""/)
  assert.match(reasoningMarkup, /data-variant="muted"/)
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
