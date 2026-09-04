import Link from "next/link";

import { AppPageHeader } from "@/components/app-page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicChatView } from "@/features/chat/chat-queries";
import { AuthenticatedChatAppFrame } from "@/features/chat/components/authenticated-chat-sidebar";
import { ChatTranscript } from "@/features/chat/components/chat-transcript";
import { SharedChatContinueButton } from "@/features/chat/components/shared-chat-continue-button";
import { SharedChatThemeToggle } from "@/features/chat/components/shared-chat-theme-toggle";
import { getCurrentUserSession } from "@/features/user/user-queries";

/** Loads public-link Chat and renders its read-only transcript. */
export async function SharedChatContent({
  publicToken,
}: {
  publicToken: string;
}) {
  const [view, { session }] = await Promise.all([
    getPublicChatView(publicToken),
    getCurrentUserSession(),
  ]);
  const isAuthenticated = session !== null;
  const sharedChatPath = `/share/${encodeURIComponent(publicToken)}`;
  const signInHref = `/sign-in?callbackURL=${encodeURIComponent(sharedChatPath)}`;
  const signUpHref = `/sign-up?callbackURL=${encodeURIComponent(sharedChatPath)}`;
  const title = (
    <p className="min-w-0 flex-1 truncate text-base sm:text-sm">{view.title}</p>
  );
  const sharedChat = (
    <>
      {isAuthenticated ? (
        <AppPageHeader data-testid="shared-chat-content">{title}</AppPageHeader>
      ) : (
        <header
          className="flex h-14 shrink-0 items-center gap-2 px-4"
          data-testid="shared-chat-content"
        >
          {title}
          <div className="flex shrink-0 items-center gap-2">
            <SharedChatThemeToggle />
            <Button
              nativeButton={false}
              render={<Link href={signInHref} />}
              size="touch-sm"
              variant="outline"
            >
              Sign in
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={signUpHref} />}
              size="touch-sm"
            >
              Sign up
            </Button>
          </div>
        </header>
      )}
      <ChatTranscript
        footer={
          <div className="flex shrink-0 justify-center px-4 pt-2 pb-[calc(--spacing(4)+env(safe-area-inset-bottom))]">
            {isAuthenticated ? (
              <SharedChatContinueButton publicToken={publicToken} />
            ) : (
              <Button
                nativeButton={false}
                render={<Link href={signInHref} />}
                size="touch"
              >
                Sign in to continue conversation
              </Button>
            )}
          </div>
        }
        messages={view.messages}
        title={view.title}
      />
    </>
  );

  return isAuthenticated ? (
    <AuthenticatedChatAppFrame onboardingCallbackPath={sharedChatPath}>
      {sharedChat}
    </AuthenticatedChatAppFrame>
  ) : (
    <main id="main-content" className="flex h-svh min-w-0 flex-col">
      {sharedChat}
    </main>
  );
}

/** Reserves public Chat header and transcript while data loads. */
export function SharedChatContentSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading shared chat"
      className="flex h-svh min-h-0 min-w-0 flex-col"
      id="main-content"
    >
      <header className="flex h-14 shrink-0 items-center gap-2 px-4">
        <Skeleton className="h-5 min-w-0 max-w-48 flex-1 sm:h-4" />
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="size-7" />
          <Skeleton className="h-11 w-16 sm:h-7 sm:w-14" />
          <Skeleton className="h-11 w-17 sm:h-7 sm:w-16" />
        </div>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-4 overflow-hidden p-4">
        <Skeleton className="h-20 w-4/5 max-w-2xl" />
        <Skeleton className="ml-auto h-12 w-3/4 max-w-md sm:w-3/5" />
        <Skeleton className="h-24 w-4/5 max-w-2xl" />
      </div>
      <div className="flex shrink-0 justify-center px-4 pt-2 pb-[calc(--spacing(4)+env(safe-area-inset-bottom))]">
        <Skeleton className="h-11 w-64 sm:h-8" />
      </div>
    </main>
  );
}
