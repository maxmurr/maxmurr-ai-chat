"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

/** Last-resort document shown when the root layout cannot render. */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <head>
        <title>Something went wrong – AI Chat</title>
        <style>{`
          :root { color-scheme: light dark; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100dvh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: #fff;
            color: #171717;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          main { width: min(100%, 420px); text-align: center; }
          .brand { margin: 0 0 24px; color: #737373; font-size: 14px; }
          h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
          .description { margin: 8px auto 24px; max-width: 42ch; color: #737373; font-size: 15px; line-height: 1.6; }
          button {
            min-height: 44px;
            border: 0;
            border-radius: 10px;
            padding: 0 14px;
            background: #171717;
            color: #fafafa;
            font: inherit;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            touch-action: manipulation;
          }
          button:active { transform: translateY(1px); }
          button:focus-visible { outline: 3px solid #a3a3a3; outline-offset: 3px; }
          @media (prefers-color-scheme: dark) {
            body { background: #171717; color: #fafafa; }
            .brand, .description { color: #a3a3a3; }
            button { background: #e5e5e5; color: #262626; }
          }
          @media (min-width: 640px) { button { min-height: 32px; } }
        `}</style>
      </head>
      <body>
        <main role="alert">
          <p className="brand">AI Chat</p>
          <h1>Something went wrong</h1>
          <p className="description">
            App could not start. Try loading it again.
          </p>
          <button onClick={retry} type="button">
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
