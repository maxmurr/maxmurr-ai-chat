import assert from "node:assert/strict"
import { test } from "node:test"

import {
  filterLibraryItems,
  LIBRARY_ITEMS,
} from "@/components/library/library-data"

test("library filtering combines type and case-insensitive name", () => {
  assert.deepEqual(
    filterLibraryItems(LIBRARY_ITEMS, "PRICING", "all").map(({ name }) => name),
    ["Pricing revamp", "pricing-brief.pdf"],
  )
  assert.deepEqual(
    filterLibraryItems(LIBRARY_ITEMS, "", "documents").map(({ name }) => name),
    ["pricing-brief.pdf", "q3-cohorts.csv"],
  )
  assert.deepEqual(filterLibraryItems(LIBRARY_ITEMS, "", "code"), [])
})
