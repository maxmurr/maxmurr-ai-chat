import type { ReactNode } from "react"

/** Frames sign-in and sign-up pages with shared auth-page layout. */
export default function AuthenticationLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground ring-3 ring-ring/50 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to main content
      </a>
      <div className="isolate flex min-h-dvh w-full flex-col bg-muted/80 px-4 pt-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <main id="main-content" className="flex flex-1 items-center justify-center">
          {children}
        </main>
        <footer className="pt-8 text-center text-xs text-muted-foreground">
          © 2026 <span translate="no">AI Chat</span>
        </footer>
      </div>
    </>
  )
}
