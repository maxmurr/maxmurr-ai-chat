import assert from "node:assert/strict"
import { test } from "node:test"

import {
  createUniqueProjectSlug,
  formatProjectSourceType,
} from "@/features/project/components/project-data"

test("project slug creation handles empty names and collisions", () => {
  assert.equal(createUniqueProjectSlug("Pricing Revamp", []), "pricing-revamp")
  assert.equal(
    createUniqueProjectSlug("Pricing Revamp", [
      "pricing-revamp",
      "pricing-revamp-2",
    ]),
    "pricing-revamp-3",
  )
  assert.equal(createUniqueProjectSlug("---", []), "project")
})

test("project source labels stay compact", () => {
  assert.equal(formatProjectSourceType("application/pdf"), "PDF")
  assert.equal(formatProjectSourceType("text/x-patch"), "Patch")
})
