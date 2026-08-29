import assert from "node:assert/strict"
import { test } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

import { ErrorState } from "@/components/ui/error-state"

test("error state keeps recovery copy in one bounded status", () => {
  const markup = renderToStaticMarkup(
    <ErrorState
      description="Try this section again."
      role="alert"
      title="Section did not load"
    >
      <button type="button">Try again</button>
    </ErrorState>
  )

  assert.match(markup, /role="alert"/)
  assert.match(markup, /max-w-md/)
  assert.match(markup, />Section did not load</)
  assert.match(markup, />Try this section again\.</)
  assert.match(markup, /type="button">Try again</)
})
