/** Frames sign-in and sign-up pages with shared auth-page layout. */
export default function AuthenticationLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="isolate flex min-h-dvh w-full flex-col bg-muted/80 pt-[calc(2.5rem+env(safe-area-inset-top))] pr-[calc(1rem+env(safe-area-inset-right))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] pl-[calc(1rem+env(safe-area-inset-left))] dark:bg-background">
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="pt-8 text-center text-xs text-muted-foreground">
        © 2026 <span translate="no">AI Chat</span>
      </footer>
    </div>
  );
}
