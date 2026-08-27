import assert from "node:assert/strict"
import { test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { ThemeProvider } from "@/components/theme-provider"

test("theme script executes only during server render", () => {
  const serverMarkup = renderToStaticMarkup(
    createElement(ThemeProvider, null, null)
  )
  assert.match(serverMarkup, /<script type="text\/javascript"/)

  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  })

  try {
    const clientMarkup = renderToStaticMarkup(
      createElement(ThemeProvider, null, null)
    )
    assert.match(clientMarkup, /<script type="text\/plain"/)
  } finally {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow)
    } else {
      Reflect.deleteProperty(globalThis, "window")
    }
  }
})
